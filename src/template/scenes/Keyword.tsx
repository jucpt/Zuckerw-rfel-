import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import type {KeywordScene} from '../types';
import {SceneProps, alpha, clamp, easeOut, fitSize, rnd, sceneFade, useReel} from '../util';

/** Ein einzelnes Wort, riesig, mit RGB-Versatz und Einschlag */
export const Keyword: React.FC<SceneProps<KeywordScene>> = ({s, T, frame}) => {
  const {colors: C, fonts, fps, width: W, contentY} = useReel();
  const color = s.color ?? C.text;
  const text = s.text.toUpperCase();
  const size = fitSize(text.split(/\s+/), 300, W * 0.9, 700, 80);
  const sp = spring({frame: frame - Math.round(s.t0 * fps), fps, config: {damping: 9, mass: 0.6, stiffness: 160}});
  const dt = T - s.t0;
  const g = clamp(1 - dt / 0.35);
  const k = Math.floor(T * 30);
  const split = 3 + 22 * g;
  const subP = easeOut(clamp((dt - 0.3) / 0.4));
  const breathe = 1 + 0.02 * Math.sin(T * 3);
  return (
    <AbsoluteFill style={{opacity: sceneFade(T, s.t0, s.t1, 0.05)}}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: contentY, transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30,
      }}>
        <div style={{
          position: 'relative', fontFamily: fonts.headline.family, fontSize: size, lineHeight: 1, textAlign: 'center', width: W * 0.94,
          transform: `scale(${(0.3 + 0.7 * sp) * breathe}) rotate(${(1 - sp) * -8}deg) translateX(${(rnd(k) - 0.5) * 40 * g}px)`,
        }}>
          <span style={{position: 'absolute', inset: 0, color: alpha(C.accent, 0.85), transform: `translate(${split}px, 0)`, mixBlendMode: 'screen'}}>{text}</span>
          <span style={{position: 'absolute', inset: 0, color: alpha(C.primary, 0.85), transform: `translate(${-split}px, 0)`, mixBlendMode: 'screen'}}>{text}</span>
          <span style={{position: 'relative', color, textShadow: `0 0 40px ${alpha(C.primary, 0.7)}, 0 10px 0 #000`, WebkitTextStroke: '3px #000'}}>{text}</span>
        </div>
        {s.subtext && (
          <div style={{
            width: W * 0.8, textAlign: 'center', fontFamily: fonts.body.family, fontWeight: 700, fontSize: 60, color: C.text,
            opacity: subP, transform: `translateY(${(1 - subP) * 24}px)`, textShadow: '0 3px 0 #000, 0 0 16px #000',
          }}>{s.subtext}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
