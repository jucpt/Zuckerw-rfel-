import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import transcript from '../../public/transcript.json';
import {C, DUR, FPS, clamp} from '../lib';

type Wd = {text: string; start: number; end: number};
type Chunk = {words: Wd[]; start: number; end: number; key: boolean};

const norm = (s: string) => s.toLowerCase().replace(/[^\wäöüß]/g, '');
const clean = (s: string) => s.replace(/[.,;:?]/g, '').toUpperCase();
const KEYWORDS = ['zuckerwürfel', 'leer'];

/** Reel-Untertitel: max. 3 Wörter, Schlüsselwörter als eigener, großer Block */
const buildChunks = (): Chunk[] => {
  const chunks: Chunk[] = [];
  const segs = transcript.segments;
  segs.forEach((seg, si) => {
    const ws: Wd[] = seg.words.map((w) => ({text: w.word, start: w.start, end: w.end}));
    const local: Chunk[] = [];
    let cur: Wd[] = [];
    const flush = (key = false) => {
      if (cur.length) local.push({words: cur, start: cur[0].start, end: 0, key});
      cur = [];
    };
    for (let i = 0; i < ws.length; i++) {
      const n = norm(ws[i].text);
      if (n === '8' && ws[i + 1] && norm(ws[i + 1].text) === 'milliarden') {
        flush(); cur = [ws[i], ws[i + 1]]; flush(true); i++; continue;
      }
      if (n === '500') {
        flush(); cur = ws.slice(i, i + 3); flush(true); i += 2; continue;
      }
      if (KEYWORDS.includes(n)) { flush(); cur = [ws[i]]; flush(true); continue; }
      cur.push(ws[i]);
      if (cur.length >= 3 || /[,.!?]$/.test(ws[i].text)) flush();
    }
    flush();
    const segEnd = seg.words[seg.words.length - 1].end;
    const nextStart = segs[si + 1] ? segs[si + 1].words[0].start : DUR - 0.12;
    local.forEach((c, i) => {
      c.end = local[i + 1] ? local[i + 1].start : Math.min(segEnd + 0.45, nextStart, DUR - 0.12);
    });
    chunks.push(...local);
  });
  return chunks;
};
const CHUNKS = buildChunks();

// Zeichenbreite von Anton (Großbuchstaben) relativ zur Schriftgröße
const charW = (s: string) => [...s].reduce((a, ch) => a + (/[MWÜÖÄ]/.test(ch) ? 0.62 : /[I1 ]/.test(ch) ? 0.3 : 0.5), 0);
const MAXW = 920;
const layout = (words: string[], maxSize: number, maxH: number) => {
  for (let size = maxSize; size >= 60; size -= 4) {
    const lines: string[][] = [[]];
    let lw = 0;
    let ok = true;
    for (const w of words) {
      const ww = charW(w) * size;
      if (ww > MAXW) { ok = false; break; }
      const add = (lines[lines.length - 1].length ? 0.28 * size : 0) + ww;
      if (lw + add > MAXW) { lines.push([w]); lw = ww; } else { lines[lines.length - 1].push(w); lw += add; }
    }
    if (ok && lines.length * size * 1.08 <= maxH) return size;
  }
  return 60;
};

export const Subtitles: React.FC<{T: number; frame: number}> = ({T, frame}) => {
  const c = CHUNKS.find((ch) => T >= ch.start && T < ch.end);
  if (!c) return null;
  const f0 = Math.round(c.start * FPS);
  const sp = spring({frame: frame - f0, fps: FPS, config: {damping: 11, mass: 0.55, stiffness: 170}});
  const appear = clamp((frame - f0) / 2);
  const hasNext = CHUNKS.some((o) => Math.abs(o.start - c.end) < 0.001);
  const out = hasNext ? 1 : clamp((c.end - T) / 0.12);
  const texts = c.words.map((w) => clean(w.text));
  const size = layout(texts, c.key ? 200 : 104, 400);
  return (
    <AbsoluteFill style={{top: 1260, height: 410, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', inset: '-60px 0', opacity: 0.85 * appear * out,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(2,3,10,0.75), rgba(2,3,10,0) 100%)'}} />
      <div
        style={{
          width: MAXW + 40,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
          columnGap: size * 0.28, rowGap: 0,
          fontFamily: 'Anton', fontSize: size, lineHeight: 1.05, letterSpacing: c.key ? 2 : 1,
          transform: `scale(${(c.key ? 0.4 : 0.65) + (c.key ? 0.6 : 0.35) * sp}) rotate(${c.key ? (1 - sp) * -6 : 0}deg)`,
          opacity: appear * out,
        }}
      >
        {c.words.map((w, i) => {
          const active = T >= w.start && (i === c.words.length - 1 || T < c.words[i + 1].start);
          const past = T >= w.start;
          const wf = Math.round(w.start * FPS);
          const wsp = spring({frame: frame - wf, fps: FPS, config: {damping: 10, mass: 0.4}});
          const col = active ? C.cyan : c.key ? (past ? C.white : 'rgba(255,255,255,0.55)') : C.white;
          return (
            <span key={i} style={{
              display: 'inline-block',
              color: col,
              transform: `scale(${active ? 1 + 0.12 * wsp - (past ? 0 : 0.12) : past ? 1 : 0.96})`,
              textShadow: active
                ? `0 0 18px ${C.cyan}, 0 0 46px ${c.key ? C.magenta : 'rgba(0,240,255,0.6)'}, 0 6px 0 #000, 0 0 4px #000`
                : `0 6px 0 #000, 0 0 10px rgba(0,0,0,0.95), 0 0 30px ${c.key ? 'rgba(255,43,214,0.6)' : 'rgba(0,0,0,0.6)'}`,
              WebkitTextStroke: c.key ? `2px ${active ? '#003a40' : '#1a0016'}` : '1.5px #000',
            }}>{clean(w.text)}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
