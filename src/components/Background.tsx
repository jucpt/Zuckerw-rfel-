import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, DUR, H, W, rnd} from '../lib';

const STARS = Array.from({length: 240}, (_, i) => ({
  x: rnd(i + 1) * W,
  y: rnd(i + 501) * H,
  r: 0.6 + rnd(i + 901) ** 3 * 2.6,
  k: 1 + Math.floor(rnd(i + 1301) * 3), // ganze Umläufe pro Video -> nahtloser Loop
  tw: 2 + Math.floor(rnd(i + 1701) * 9),
  ph: rnd(i + 2101) * Math.PI * 2,
  col: rnd(i + 2501) < 0.22 ? C.magenta : rnd(i + 2901) < 0.5 ? C.cyan : C.white,
}));

/** Fast schwarzer Raum mit Nebel und aufsteigenden Partikeln – periodisch über die Videolänge */
export const Background: React.FC<{T: number}> = ({T}) => {
  const ph = (T / DUR) * Math.PI * 2;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at ${30 + 8 * Math.sin(ph)}% ${30 + 6 * Math.cos(ph)}%, rgba(0,200,255,0.13), transparent 70%),
            radial-gradient(ellipse 65% 40% at ${72 + 7 * Math.cos(ph * 2)}% ${70 + 5 * Math.sin(ph)}%, rgba(255,40,210,0.12), transparent 70%),
            radial-gradient(ellipse 60% 35% at 50% 43%, rgba(90,70,255,0.07), transparent 70%)`,
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {STARS.map((s, i) => {
          const y = (((s.y - (H + 40) * s.k * (T / DUR)) % (H + 40)) + H + 40) % (H + 40) - 20;
          const o = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(ph * s.tw + s.ph)) ** 2;
          return <circle key={i} cx={s.x + 6 * Math.sin(ph * s.k + s.ph)} cy={y} r={s.r} fill={s.col} opacity={o * 0.8} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
