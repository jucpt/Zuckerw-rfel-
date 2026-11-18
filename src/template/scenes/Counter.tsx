import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {CounterScene} from '../types';
import {SceneProps, alpha, charW, clamp, easeInOut, easeOut, fitSize, fmtDE, lerp, neon, pulse, sceneFade, useReel} from '../util';

/** Großer Zähler, der von `from` auf `to` hochläuft, mit Fortschrittsring */
export const Counter: React.FC<SceneProps<CounterScene>> = ({s, T}) => {
  const {colors: C, fonts, width: W, contentY} = useReel();
  const from = s.from ?? 0;
  const tEnd = s.times.countUntil;
  const p = clamp((T - s.t0 - 0.1) / Math.max(tEnd - s.t0 - 0.1, 0.05));
  const curve = s.curve ?? (Math.abs(s.to) >= 1e5 ? 'log' : 'ease');
  let value: number;
  if (curve === 'log' && from >= 0 && s.to > 0) {
    const q = Math.pow(p, 1.6);
    value = p >= 1 ? s.to : Math.pow(10, lerp(Math.log10(Math.max(from, 1)), Math.log10(s.to), q));
    if (p <= 0) value = from;
  } else {
    value = lerp(from, s.to, curve === 'linear' ? p : easeInOut(p));
  }
  const dec = s.decimals ?? 0;
  const text = `${s.prefix ?? ''}${fmtDE(value, dec)}${s.suffix ?? ''}`;
  const finalText = `${s.prefix ?? ''}${fmtDE(s.to, dec)}${s.suffix ?? ''}`;
  const size = fitSize([finalText], 210, W * 0.8, 260, 60);
  const done = pulse(T, tEnd, 0.35);
  const fade = sceneFade(T, s.t0, s.t1);
  // Ring wächst mit, damit lange Zahlen nicht über den Rand ragen
  const R = Math.min(W * 0.47, Math.max(330, (charW(finalText) * size) / 2 + 60));
  const circ = 2 * Math.PI * R;
  const labelP = easeOut(clamp((T - s.t0 - 0.25) / 0.4));
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <svg width={W} height={contentY * 2} style={{position: 'absolute'}}>
        <circle cx={W / 2} cy={contentY} r={R} fill="none" stroke={alpha(C.secondary, 0.25)} strokeWidth={10} />
        <circle cx={W / 2} cy={contentY} r={R} fill="none" stroke={C.primary} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${circ * p} ${circ}`} transform={`rotate(-90 ${W / 2} ${contentY})`}
          style={{filter: `drop-shadow(0 0 14px ${C.primary})`}} />
        <circle cx={W / 2} cy={contentY} r={R * (1 + 0.4 * (1 - done))} fill="none" stroke={C.accent}
          strokeWidth={6} opacity={done} />
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: contentY, transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          fontFamily: fonts.headline.family, fontSize: size, color: p >= 1 ? C.text : C.primary, fontVariantNumeric: 'tabular-nums',
          transform: `scale(${1 + 0.15 * done})`, textShadow: neon(p >= 1 ? C.accent : C.primary, 0.8 + done),
          WebkitTextStroke: '2px #000', whiteSpace: 'nowrap',
        }}>{text}</div>
        {s.label && (
          <div style={{
            fontFamily: fonts.body.family, fontWeight: 700, fontSize: 64, letterSpacing: 6, textTransform: 'uppercase',
            color: C.text, opacity: labelP, textShadow: '0 3px 0 #000, 0 0 16px #000',
          }}>{s.label}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
