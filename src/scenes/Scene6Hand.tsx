import React from 'react';
import {AbsoluteFill} from 'remotion';
import hand from '../hand.json';
import {C, CX, CY, DUR, EV, FPS, H, W, clamp, easeIn, easeOut, pulse, rnd} from '../lib';
import {Glow} from '../components/Defs';

const HS = 0.86;
const HC = {x: 577, y: 600}; // Mittelpunkt der Hand-Bounding-Box
const PTS = hand.points.map((p, i) => ({
  x: p[0], y: p[1], o: p[2] === 1,
  sx: (rnd(i + 3) - 0.5) * 2600, sy: (rnd(i + 7) - 0.5) * 3200,
  d: rnd(i + 11), w: 4 + rnd(i + 13) * 9, ph: rnd(i + 17) * 6.28,
}));

/** Szene 6: Ruhige Umrisshand aus flimmernden Partikeln, löst sich zum Loop auf */
export const Scene6Hand: React.FC<{T: number}> = ({T}) => {
  const t0 = EV.handCalm;
  const out = easeIn(clamp((T - EV.loopStart) / (DUR - 1 / FPS - EV.loopStart)));
  const breathe = 1 + 0.012 * Math.sin(T * 2.2) + 0.02 * pulse(T, EV.hand, 0.6, 0.15);
  const glow = 0.25 + 0.3 * pulse(T, EV.hand, 0.8, 0.2);
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <defs><Glow id="s6-g" sd={3.5} /></defs>
        <g transform={`translate(${CX},${CY}) scale(${HS * breathe}) rotate(${out * 40}) translate(${-HC.x},${-HC.y})`}>
          <path d={hand.outline} fill="none" stroke={C.cyan} strokeWidth={2} opacity={glow * clamp((T - t0 - 0.4) / 0.5) * (1 - out)} filter="url(#s6-g)" />
          <g filter="url(#s6-g)">
            {PTS.map((p, i) => {
              const a = easeOut(clamp((T - t0 - p.d * 0.35) / 0.65));
              const fl = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(T * p.w + p.ph), 2);
              const jx = Math.sin(T * 3 + p.ph) * 1.6, jy = Math.cos(T * 2.6 + p.ph) * 1.6;
              // Auflösen: Partikel spiralen nach innen (Richtung Würfel aus Szene 1)
              const k = 1 - out * (0.6 + 0.4 * p.d);
              const x = HC.x + ((p.x + (1 - a) * p.sx + jx) - HC.x) * k;
              const y = HC.y + ((p.y + (1 - a) * p.sy + jy) - HC.y) * k;
              return <circle key={i} cx={x} cy={y} r={p.o ? 3 : 2.2} fill={p.o ? C.cyan : i % 3 ? C.violet : C.magenta}
                opacity={fl * (p.o ? 1 : 0.55) * a * (1 - out)} />;
            })}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
