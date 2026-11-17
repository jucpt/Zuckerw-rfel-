import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FX, H, W, pulse, rnd, wobble} from '../lib';

/** Kamera-Wirkung der globalen Eye-Catcher (Zoom-Punch, Glitch-Versatz) */
export const globalCamera = (T: number) => {
  let scale = 1, jx = 0, jy = 0, skew = 0, glitch = 0;
  for (const e of FX) {
    const dt = T - e.t;
    if (dt < -0.05 || dt > 1.2) continue;
    if (e.type === 'punch') scale += 0.085 * pulse(T, e.t, 0.13, 0.035);
    if (e.type === 'flash') scale += 0.05 * pulse(T, e.t, 0.18, 0.02);
    if (e.type === 'glitch' && dt >= 0 && dt < 0.26) {
      const k = Math.floor(T * 30);
      const g = 1 - dt / 0.26;
      glitch = Math.max(glitch, g);
      jx += (rnd(k * 3.1 + e.t) - 0.5) * 60 * g;
      jy += (rnd(k * 7.7 + e.t) - 0.5) * 16 * g;
      skew += (rnd(k * 1.3 + e.t) - 0.5) * 6 * g;
    }
  }
  return {scale, jx, jy, skew, glitch};
};

export const cameraStyle = (T: number): React.CSSProperties => {
  const c = globalCamera(T);
  const split = 4 + 14 * c.glitch;
  return {
    transform: `translate(${c.jx}px, ${c.jy}px) skewX(${c.skew}deg) scale(${c.scale})`,
    transformOrigin: '540px 820px',
    filter: c.glitch > 0.02
      ? `drop-shadow(${split}px 0 0 rgba(255,43,214,0.75)) drop-shadow(${-split}px 0 0 rgba(0,240,255,0.75))`
      : undefined,
  };
};

/** Overlays: Lichtblitze, Glitch-Balken, Scanlines, Vignette */
export const FXOverlay: React.FC<{T: number}> = ({T}) => {
  let flash = 0, glitch = 0, gt = 0;
  for (const e of FX) {
    if (e.type === 'flash') {
      const big = e.src === 'implode' || e.src === 'impact';
      flash = Math.max(flash, (big ? 1 : 0.6) * pulse(T, e.t, big ? 0.22 : 0.12, 0.02));
    }
    if (e.type === 'glitch') {
      const dt = T - e.t;
      if (dt >= 0 && dt < 0.26) { glitch = Math.max(glitch, 1 - dt / 0.26); gt = e.t; }
    }
    if (e.type === 'punch') flash = Math.max(flash, 0.12 * pulse(T, e.t, 0.08, 0.02));
  }
  const k = Math.floor(T * 30);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {glitch > 0 && (
        <svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'screen'}}>
          {Array.from({length: 9}, (_, i) => {
            const y = rnd(k * 13 + i * 7 + gt) * H;
            const h = 4 + rnd(k * 5 + i * 3) * 46;
            const x = (rnd(k * 2 + i) - 0.5) * 300;
            return (
              <rect key={i} x={x} y={y} width={W} height={h}
                fill={i % 2 ? C.cyan : C.magenta} opacity={(0.08 + 0.3 * rnd(k + i * 9)) * glitch} />
            );
          })}
          {Array.from({length: 5}, (_, i) => (
            <rect key={'b' + i} x={rnd(k * 3 + i) * W} y={rnd(k * 17 + i) * H} width={40 + rnd(i + k) * 200} height={8 + rnd(k + i * 2) * 20}
              fill={C.white} opacity={0.35 * glitch} />
          ))}
        </svg>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 43%, rgba(220,250,255,1), rgba(160,240,255,0.85) 40%, rgba(255,120,240,0.6))', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 2px, transparent 4px)', opacity: 0.8 + 0.2 * wobble(T, 3)}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};
