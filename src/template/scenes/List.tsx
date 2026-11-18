import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import type {ListScene} from '../types';
import {SceneProps, alpha, clamp, easeOut, neon, sceneFade, useReel} from '../util';

/** Überschrift plus nummerierte Punkte, die nacheinander erscheinen */
export const List: React.FC<SceneProps<ListScene>> = ({s, T, frame}) => {
  const {colors: C, fonts, fps, width: W, contentY} = useReel();
  const items = s.items.map((it) => (typeof it === 'string' ? it : it.text));
  const titleP = easeOut(clamp((T - s.t0) / 0.35));
  const n = items.length;
  const fontSize = n > 4 ? 52 : 62;
  return (
    <AbsoluteFill style={{opacity: sceneFade(T, s.t0, s.t1)}}>
      <div style={{
        position: 'absolute', left: W * 0.08, right: W * 0.08, top: contentY, transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 34,
      }}>
        {s.title && (
          <div style={{
            fontFamily: fonts.headline.family, fontSize: 120, lineHeight: 1.05, color: C.text, textAlign: 'center', marginBottom: 20,
            opacity: titleP, transform: `translateY(${(1 - titleP) * -30}px)`, textShadow: `0 6px 0 #000, 0 0 30px ${alpha(C.primary, 0.5)}`,
            WebkitTextStroke: '1.5px #000',
          }}>{s.title.toUpperCase()}</div>
        )}
        {items.map((txt, i) => {
          const t = s.times[`item${i}`];
          const sp = spring({frame: frame - Math.round(t * fps), fps, config: {damping: 12, mass: 0.5}});
          const isNew = T >= t && (i === n - 1 || T < s.times[`item${i + 1}`]);
          const col = i % 2 ? C.accent : C.primary;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 32, opacity: T < t ? 0 : clamp(sp * 1.5),
              transform: `translateX(${(1 - sp) * -120}px)`,
            }}>
              <div style={{
                flex: '0 0 auto', width: 104, height: 104, borderRadius: 24, border: `5px solid ${col}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: alpha(col, isNew ? 0.3 : 0.12),
                fontFamily: fonts.headline.family, fontSize: 64, color: C.text, boxShadow: `0 0 ${isNew ? 40 : 18}px ${alpha(col, 0.7)}`,
              }}>{i + 1}</div>
              <div style={{
                fontFamily: fonts.body.family, fontWeight: 700, fontSize, lineHeight: 1.12, color: C.text,
                textShadow: isNew ? neon(col, 0.35) : '0 3px 0 #000, 0 0 14px #000',
              }}>{txt}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
