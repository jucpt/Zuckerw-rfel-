import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import type {TitleScene} from '../types';
import {SceneProps, alpha, clamp, easeOut, fitSize, neon, sceneFade, useReel} from '../util';

/** Überschrift, Wort für Wort eingeblendet, optional mit Dachzeile und Unterzeile */
export const Title: React.FC<SceneProps<TitleScene>> = ({s, T, frame}) => {
  const {colors: C, fonts, fps, width: W, contentY} = useReel();
  const words = s.title.toUpperCase().split(/\s+/).filter(Boolean);
  const size = fitSize(words, 180, W * 0.86, 620, 64);
  const fade = sceneFade(T, s.t0, s.t1);
  const stagger = Math.min(0.12, (s.t1 - s.t0) * 0.4 / Math.max(words.length, 1));
  const lineP = easeOut(clamp((T - s.t0 - 0.15) / 0.5));
  const subP = easeOut(clamp((T - s.t0 - 0.3 - words.length * stagger) / 0.4));
  const drift = 1 + 0.03 * clamp((T - s.t0) / (s.t1 - s.t0));
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: contentY, transform: `translateY(-50%) scale(${drift})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
      }}>
        {s.kicker && (
          <div style={{
            fontFamily: fonts.body.family, fontWeight: 700, fontSize: 46, letterSpacing: 10, color: C.primary,
            textTransform: 'uppercase', opacity: lineP, textShadow: neon(C.primary, 0.6),
          }}>{s.kicker}</div>
        )}
        <div style={{
          width: W * 0.9, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.28,
          fontFamily: fonts.headline.family, fontSize: size, lineHeight: 1.05, color: C.text,
        }}>
          {words.map((w, i) => {
            const sp = spring({frame: frame - Math.round((s.t0 + i * stagger) * fps), fps, config: {damping: 11, mass: 0.5}});
            return (
              <span key={i} style={{
                display: 'inline-block', opacity: clamp(sp * 2), transform: `translateY(${(1 - sp) * 60}px) scale(${0.6 + 0.4 * sp})`,
                textShadow: `0 6px 0 #000, 0 0 30px ${alpha(i % 2 ? C.accent : C.primary, 0.55)}`, WebkitTextStroke: '1.5px #000',
              }}>{w}</span>
            );
          })}
        </div>
        <div style={{
          width: W * 0.5 * lineP, height: 6, borderRadius: 3,
          background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, boxShadow: `0 0 24px ${C.primary}`,
        }} />
        {s.subtitle && (
          <div style={{
            width: W * 0.82, textAlign: 'center', fontFamily: fonts.body.family, fontWeight: 700, fontSize: 58, lineHeight: 1.15,
            color: C.text, opacity: subP, transform: `translateY(${(1 - subP) * 20}px)`, textShadow: '0 3px 0 #000, 0 0 16px #000',
          }}>{s.subtitle}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
