import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, CX, CY, EV, H, W, clamp, pulse, rnd, shake} from '../lib';
import {Glow, HaloGrad, PersonSymbol} from '../components/Defs';
import {HoloCube} from '../components/HoloCube';

const N = 1700;
const PEOPLE = Array.from({length: N}, (_, i) => ({
  r0: 210 + 1150 * Math.sqrt(rnd(i + 1)),
  a0: rnd(i + 1001) * Math.PI * 2,
  d: rnd(i + 2001) * 0.85,
  dur: 0.7 + rnd(i + 3001) * 0.45,
  s: 0.42 + rnd(i + 4001) * 0.5,
  col: rnd(i + 5001) < 0.62 ? C.cyan : rnd(i + 6001) < 0.7 ? C.magenta : C.white,
  w: 0.1 + rnd(i + 7001) * 0.12,
}));

/** Szene 1: Tausende Menschen werden in einen leuchtenden Würfel gesogen.
 *  Funktioniert auch für negative T (Loop-Übergang am Videoende). */
export const Scene1Humanity: React.FC<{T: number}> = ({T}) => {
  const st = EV.suckStart - 0.6;
  const cam = 0.9 + 0.085 * T + 0.05 * pulse(T, EV.cubeHit, 0.4);
  const sh = shake(T, EV.keinWitz, 38, 0.32);
  const sh2 = shake(T, EV.witz, 22, 0.25);
  const rot = -2.5 + 0.55 * T + sh.r + sh2.r;
  let absorbed = 0;
  const items: React.ReactNode[] = [];
  const streaks: string[] = [];
  for (let i = 0; i < N; i++) {
    const p = PEOPLE[i];
    const raw = clamp((T - st - p.d) / p.dur);
    const s = raw * raw * (1.6 - 0.6 * raw);
    if (raw >= 0.985) { absorbed++; continue; }
    const r = p.r0 * (1 - s) * (1 + 0.03 * Math.sin(T * 1.9 + p.a0 * 3));
    const a = p.a0 + p.w * T + 2.4 * s * s;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r * 0.9;
    if (Math.abs(x - CX) * cam > 640 || Math.abs(y - CY) * cam > 1150) continue;
    const sc = p.s * Math.pow(1 - s, 0.5) * (0.6 + 0.4 * clamp(r / 450));
    const op = clamp(r / 90) * (0.55 + 0.45 * Math.min(1, s * 3 + 0.3));
    if (s > 0.12 && i % 3 === 0) {
      const r2 = r * (1 + 0.35 * s) + 30;
      const a2 = a - 0.35 * s;
      streaks.push(`M${x.toFixed(1)},${y.toFixed(1)} L${(CX + Math.cos(a2) * r2).toFixed(1)},${(CY + Math.sin(a2) * r2 * 0.9).toFixed(1)}`);
    }
    items.push(
      <use key={i} href="#s1-person" transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${((a * 180) / Math.PI + 90) * s}) scale(${sc.toFixed(3)})`}
        fill={p.col} opacity={op} />,
    );
  }
  const frac = absorbed / N;
  const hit = pulse(T, EV.cubeHit, 0.35);
  const size = 120 + 70 * frac + 50 * hit;
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <defs>
          <Glow id="s1-g" sd={5} />
          <Glow id="s1-cube" sd={7} />
          <HaloGrad id="s1-cube-halo" color={C.cyan} />
          <HaloGrad id="s1-halo2" color={C.magenta} />
          <PersonSymbol id="s1-person" />
        </defs>
        <g transform={`translate(${CX + sh.x + sh2.x},${CY + sh.y + sh2.y}) rotate(${rot}) scale(${cam}) translate(${-CX},${-CY})`}>
          {/* Energieringe */}
          {[0, 1, 2, 3].map((k) => {
            const ph = ((T * 0.7 + k / 4) % 1 + 1) % 1;
            const rr = 900 * (1 - ph) + 90;
            return <ellipse key={k} cx={CX} cy={CY} rx={rr} ry={rr * 0.9} fill="none" stroke={k % 2 ? C.magenta : C.cyan}
              strokeWidth={2} opacity={0.35 * ph * (0.4 + frac)} />;
          })}
          <circle cx={CX} cy={CY} r={420 + 200 * frac} fill="url(#s1-halo2)" opacity={0.22 + 0.3 * frac + 0.4 * hit} />
          <path d={streaks.join(' ')} stroke={C.cyanSoft} strokeWidth={1.6} opacity={0.35} strokeLinecap="round" />
          <g filter="url(#s1-g)">{items}</g>
          <HoloCube x={CX} y={CY} size={size} rotY={0.7 * T + 0.6} rotX={-0.55} glow={0.6 + 0.6 * frac + hit} filterId="s1-cube" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
