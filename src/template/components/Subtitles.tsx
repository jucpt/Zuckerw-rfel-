import React, {useMemo} from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {norm} from '../resolve';
import type {Resolved, Word} from '../types';
import {alpha, clamp, fitSize, useReel} from '../util';

type Chunk = {words: Word[]; start: number; end: number; key: boolean};

/** Untertitel-Blöcke: max. N Wörter, Schlüsselwörter (auch Wortgruppen) als eigener großer Block */
const buildChunks = (r: Resolved): Chunk[] => {
  const segs = r.segments ?? [];
  const maxWords = r.cfg.subtitles?.maxWords ?? 3;
  const keys = (r.cfg.subtitles?.keywords ?? []).map((k) => k.split(/\s+/).map(norm).filter(Boolean));
  const out: Chunk[] = [];
  segs.forEach((seg, si) => {
    const ws = seg.words;
    if (!ws.length) return;
    const local: Chunk[] = [];
    let cur: Word[] = [];
    const flush = (key = false) => {
      if (cur.length) local.push({words: cur, start: cur[0].start, end: 0, key});
      cur = [];
    };
    for (let i = 0; i < ws.length; i++) {
      const kw = keys.find((k) => k.every((p, j) => ws[i + j] && norm(ws[i + j].text) === p));
      if (kw) { flush(); cur = ws.slice(i, i + kw.length); flush(true); i += kw.length - 1; continue; }
      cur.push(ws[i]);
      if (cur.length >= maxWords || /[,.!?;:]$/.test(ws[i].text)) flush();
    }
    flush();
    const segEnd = ws[ws.length - 1].end;
    const nextStart = segs[si + 1]?.words[0]?.start ?? r.duration - 0.12;
    local.forEach((c, i) => {
      c.end = local[i + 1] ? local[i + 1].start : Math.min(segEnd + 0.45, nextStart, r.duration - 0.12);
    });
    out.push(...local);
  });
  return out;
};

export const Subtitles: React.FC<{T: number; frame: number}> = ({T, frame}) => {
  const r = useReel();
  const {colors: C, fps: FPS, width: W, height: H, fonts} = r;
  const chunks = useMemo(() => buildChunks(r), [r]);
  const upper = r.cfg.subtitles?.uppercase !== false;
  const clean = (s: string) => {
    const t = s.replace(/[.,;:?]/g, '');
    return upper ? t.toUpperCase() : t;
  };
  const c = chunks.find((ch) => T >= ch.start && T < ch.end);
  if (!c) return null;
  const maxW = W * 0.85;
  const f0 = Math.round(c.start * FPS);
  const sp = spring({frame: frame - f0, fps: FPS, config: {damping: 11, mass: 0.55, stiffness: 170}});
  const appear = clamp((frame - f0) / 2);
  const hasNext = chunks.some((o) => Math.abs(o.start - c.end) < 0.001);
  const out = hasNext ? 1 : clamp((c.end - T) / 0.12);
  const size = fitSize(c.words.map((w) => clean(w.text)), c.key ? 200 : 104, maxW, 400, 60);
  return (
    <AbsoluteFill style={{top: H * 0.656, height: 410, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', inset: '-60px 0', opacity: 0.85 * appear * out,
        background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${alpha(C.background, 0.75)}, ${alpha(C.background, 0)} 100%)`}} />
      <div style={{
        width: maxW + 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        columnGap: size * 0.34, fontFamily: fonts.headline.family, fontSize: size, lineHeight: 1.05, letterSpacing: c.key ? 2 : 1,
        transform: `scale(${(c.key ? 0.4 : 0.65) + (c.key ? 0.6 : 0.35) * sp}) rotate(${c.key ? (1 - sp) * -6 : 0}deg)`,
        opacity: appear * out,
      }}>
        {c.words.map((w, i) => {
          const active = T >= w.start && (i === c.words.length - 1 || T < c.words[i + 1].start);
          const past = T >= w.start;
          const wsp = spring({frame: frame - Math.round(w.start * FPS), fps: FPS, config: {damping: 10, mass: 0.4}});
          const col = active ? C.primary : c.key ? (past ? C.text : alpha(C.text, 0.55)) : C.text;
          return (
            <span key={i} style={{
              display: 'inline-block', color: col,
              transform: `scale(${active ? 1 + 0.12 * wsp - (past ? 0 : 0.12) : past ? 1 : 0.96})`,
              textShadow: active
                ? `0 0 18px ${C.primary}, 0 0 46px ${c.key ? C.accent : alpha(C.primary, 0.6)}, 0 6px 0 #000, 0 0 4px #000`
                : `0 6px 0 #000, 0 0 10px rgba(0,0,0,0.95), 0 0 30px ${c.key ? alpha(C.accent, 0.6) : 'rgba(0,0,0,0.6)'}`,
              WebkitTextStroke: c.key ? '2px rgba(0,0,0,0.8)' : '1.5px #000',
            }}>{clean(w.text)}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
