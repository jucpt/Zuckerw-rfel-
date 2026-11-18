import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Resolved} from '../types';
import {alpha, pulse, rnd, useReel, wobble} from '../util';

/** Kamera-Wirkung der Effekte (Zoom-Punch, Shake, Glitch-Versatz) */
const camera = (fx: Resolved['effects'], T: number) => {
  let scale = 1, jx = 0, jy = 0, skew = 0, rot = 0, glitch = 0;
  for (const e of fx) {
    const dt = T - e.t;
    if (dt < -0.05 || dt > 1.2) continue;
    const k = e.strength;
    if (e.type === 'punch') scale += 0.085 * k * pulse(T, e.t, 0.13, 0.035);
    if (e.type === 'flash') scale += 0.05 * k * pulse(T, e.t, 0.18, 0.02);
    if (e.type === 'shake') {
      const p = pulse(T, e.t, 0.3, 0.015) * k;
      jx += wobble(T, 1 + e.t) * 36 * p;
      jy += wobble(T, 7 + e.t) * 36 * p;
      rot += wobble(T, 13 + e.t) * 2 * p;
    }
    if (e.type === 'glitch' && dt >= 0 && dt < 0.26) {
      const f = Math.floor(T * 30);
      const g = (1 - dt / 0.26) * k;
      glitch = Math.max(glitch, g);
      jx += (rnd(f * 3.1 + e.t) - 0.5) * 60 * g;
      jy += (rnd(f * 7.7 + e.t) - 0.5) * 16 * g;
      skew += (rnd(f * 1.3 + e.t) - 0.5) * 6 * g;
    }
  }
  return {scale, jx, jy, skew, rot, glitch};
};

/** Wrapper: alles darin wird von den Effekten "gefilmt" */
export const Camera: React.FC<{T: number; children: React.ReactNode}> = ({T, children}) => {
  const {effects, colors: C, width, contentY} = useReel();
  const c = camera(effects, T);
  const split = 4 + 14 * c.glitch;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${c.jx}px, ${c.jy}px) rotate(${c.rot}deg) skewX(${c.skew}deg) scale(${c.scale})`,
        transformOrigin: `${width / 2}px ${contentY}px`,
        filter: c.glitch > 0.02
          ? `drop-shadow(${split}px 0 0 ${alpha(C.accent, 0.75)}) drop-shadow(${-split}px 0 0 ${alpha(C.primary, 0.75)})`
          : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Overlays: Lichtblitze, Glitch-Balken, Scanlines, Vignette */
export const FXOverlay: React.FC<{T: number}> = ({T}) => {
  const {effects, colors: C, width: W, height: H, cfg} = useReel();
  const bg = cfg.background ?? {};
  let flash = 0, glitch = 0, gt = 0;
  for (const e of effects) {
    if (e.type === 'flash') flash = Math.max(flash, Math.min(1, 0.7 * e.strength) * pulse(T, e.t, 0.12 + 0.1 * Math.min(e.strength, 1.5), 0.02));
    if (e.type === 'punch') flash = Math.max(flash, 0.12 * e.strength * pulse(T, e.t, 0.08, 0.02));
    if (e.type === 'glitch') {
      const dt = T - e.t;
      if (dt >= 0 && dt < 0.26) { glitch = Math.max(glitch, (1 - dt / 0.26) * e.strength); gt = e.t; }
    }
  }
  const k = Math.floor(T * 30);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {glitch > 0 && (
        <svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'screen'}}>
          {Array.from({length: 9}, (_, i) => (
            <rect key={i} x={(rnd(k * 2 + i) - 0.5) * 300} y={rnd(k * 13 + i * 7 + gt) * H} width={W} height={4 + rnd(k * 5 + i * 3) * 46}
              fill={i % 2 ? C.primary : C.accent} opacity={(0.08 + 0.3 * rnd(k + i * 9)) * glitch} />
          ))}
          {Array.from({length: 5}, (_, i) => (
            <rect key={'b' + i} x={rnd(k * 3 + i) * W} y={rnd(k * 17 + i) * H} width={40 + rnd(i + k) * 200} height={8 + rnd(k + i * 2) * 20}
              fill={C.text} opacity={0.35 * glitch} />
          ))}
        </svg>
      )}
      {flash > 0.001 && (
        <AbsoluteFill style={{
          background: `radial-gradient(circle at 50% 43%, ${alpha(C.text, 1)}, ${alpha(C.primary, 0.85)} 40%, ${alpha(C.accent, 0.6)})`,
          opacity: flash, mixBlendMode: 'screen',
        }} />
      )}
      {bg.scanlines !== false && (
        <AbsoluteFill style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 2px, transparent 4px)',
          opacity: 0.8 + 0.2 * wobble(T, 3),
        }} />
      )}
      {bg.vignette !== false && (
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.75) 100%)'}} />
      )}
    </AbsoluteFill>
  );
};
