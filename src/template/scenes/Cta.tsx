import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import type {CtaScene} from '../types';
import {SceneProps, alpha, clamp, easeOut, fitSize, neon, sceneFade, useReel} from '../util';

/** Abschluss: Aufforderung, Account-Name und pulsierender Button */
export const Cta: React.FC<SceneProps<CtaScene>> = ({s, T, frame}) => {
  const {colors: C, fonts, fps, width: W, contentY} = useReel();
  const sp = spring({frame: frame - Math.round(s.t0 * fps), fps, config: {damping: 10, mass: 0.6}});
  const words = s.title.toUpperCase().split(/\s+/);
  const size = fitSize(words, 150, W * 0.86, 420, 64);
  const hP = easeOut(clamp((T - s.t0 - 0.25) / 0.4));
  const bP = spring({frame: frame - Math.round((s.t0 + 0.45) * fps), fps, config: {damping: 9, mass: 0.5}});
  const beat = 1 + 0.05 * Math.max(0, Math.sin((T - s.t0) * Math.PI * 2 * 1.2));
  return (
    <AbsoluteFill style={{opacity: sceneFade(T, s.t0, s.t1, 0.18, 0.08)}}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: contentY, transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40,
      }}>
        <div style={{
          width: W * 0.9, textAlign: 'center', fontFamily: fonts.headline.family, fontSize: size, lineHeight: 1.05, color: C.text,
          transform: `scale(${0.5 + 0.5 * sp})`, opacity: clamp(sp * 2),
          textShadow: `0 6px 0 #000, 0 0 36px ${alpha(C.accent, 0.6)}`, WebkitTextStroke: '1.5px #000',
        }}>{words.join(' ')}</div>
        {s.handle && (
          <div style={{
            fontFamily: fonts.body.family, fontWeight: 700, fontSize: 70, color: C.primary, letterSpacing: 2,
            opacity: hP, transform: `translateY(${(1 - hP) * 20}px)`, textShadow: neon(C.primary, 0.6),
          }}>{s.handle}</div>
        )}
        {s.button && (
          <div style={{
            marginTop: 10, padding: '26px 70px', borderRadius: 999,
            background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
            fontFamily: fonts.headline.family, fontSize: 64, color: C.background, letterSpacing: 2,
            transform: `scale(${(0.4 + 0.6 * bP) * beat})`, opacity: clamp(bP * 2),
            boxShadow: `0 0 50px ${alpha(C.accent, 0.6)}, 0 0 20px ${alpha(C.primary, 0.8)}`,
          }}>{s.button.toUpperCase()}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
