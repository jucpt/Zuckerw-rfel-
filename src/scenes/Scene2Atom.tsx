import React from 'react';
import {AbsoluteFill} from 'remotion';
import hand from '../hand.json';
import {C, CX, CY, EV, H, SC, W, clamp, easeInOut, easeOut, lerp, prog, pulse, rnd, smooth} from '../lib';
import {Glow, HaloGrad, SphereGrad} from '../components/Defs';

// Zielpunkt in der Handfläche (Hand-Koordinaten)
const P = {x: hand.palm[0], y: hand.palm[1]};
const HS = 0.95;
const PIV0 = {x: CX, y: CY + 70};
const ZMAX = 90;

const CELLS = Array.from({length: 46}, (_, i) => {
  const a = rnd(i + 11) * Math.PI * 2, r = Math.sqrt(rnd(i + 31)) * 620;
  return {x: Math.cos(a) * r, y: Math.sin(a) * r, r: 38 + rnd(i + 51) * 46, k: rnd(i + 71)};
});
CELLS.push({x: 0, y: 0, r: 70, k: 0.5});
const LATTICE: {x: number; y: number}[] = [];
for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
  const x = (i + (j % 2 ? 0.5 : 0)) * 62, y = j * 54;
  if (x * x + y * y < 470 * 470) LATTICE.push({x, y});
}
export const NUCLEUS = Array.from({length: 15}, (_, i) => {
  const a = i * 2.399, r = 9 * Math.sqrt(i);
  return {x: Math.cos(a) * r, y: Math.sin(a) * r, p: i % 2 === 0};
});
const ORBITS = [0, 60, 120].map((deg, k) => ({deg, w: [2.4, -3.1, 2.8][k], ph: k * 2.1}));

const layerOp = (d: number, a0: number, a1: number, b0: number, b1: number) => smooth(a0, a1, d) * (1 - smooth(b0, b1, d));

export const Nucleus: React.FC<{scale: number; T: number; idp: string}> = ({scale, T, idp}) => (
  <g transform={`scale(${scale})`}>
    <circle r={60} fill={`url(#${idp}-nh)`} opacity={0.9} />
    {NUCLEUS.map((n, i) => (
      <circle key={i} cx={n.x + Math.sin(T * 9 + i) * 1.2} cy={n.y + Math.cos(T * 8 + i * 2) * 1.2} r={12}
        fill={n.p ? `url(#${idp}-sp)` : `url(#${idp}-sn)`} />
    ))}
  </g>
);

/** Szene 2: Zoom durch die Hand bis in ein Atom – Elektronen kreisen um riesige Leere */
export const Scene2Atom: React.FC<{T: number}> = ({T}) => {
  const t0 = SC.s2[0];
  const draw = easeOut(prog(T, t0, t0 + 0.55));
  const z = easeInOut(prog(T, EV.handZoom, EV.atomArrive + 0.35));
  const Z = Math.pow(ZMAX, z);
  const piv = {x: lerp(PIV0.x, CX, z), y: lerp(PIV0.y, CY, z)};
  const tr = (zk: number) => `translate(${piv.x},${piv.y}) scale(${Z / zk})`;
  // Leere-Phase
  const e = easeInOut(prog(T, EV.fast - 0.1, EV.leer + 0.35));
  const nucS = lerp(1, 0.09, e);
  const orbS = lerp(1, 1.75, e) * (1 + 0.04 * pulse(T, EV.atomePunch, 0.3));
  const atomRot = 8 * Math.sin(T * 0.6) + 25 * e;
  const lp = pulse(T, EV.leer, 0.5);
  const atomOp = layerOp(Z / ZMAX, 0.08, 0.5, 99, 100);
  const scan = ((T - t0) * 1.4) % 1;
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <defs>
          <Glow id="s2-g" sd={5} />
          <Glow id="s2-g2" sd={10} />
          <SphereGrad id="s2-sp" color={C.magenta} />
          <SphereGrad id="s2-sn" color={C.cyan} />
          <SphereGrad id="s2-el" color={C.cyanSoft} />
          <HaloGrad id="s2-nh" color={C.magenta} />
          <HaloGrad id="s2-cell" color={C.cyan} />
          <clipPath id="s2-clip"><path d={hand.outline} /></clipPath>
        </defs>
        {/* Ebene 1: Hand */}
        {Z < 9 && (
          <g transform={`${tr(1)} scale(${HS}) translate(${-P.x},${-P.y})`} opacity={1 - smooth(3, 8, Z)}>
            <g clipPath="url(#s2-clip)">
              {hand.points.filter((_, i) => i % 2 === 0).map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={p[2] ? 2.2 : 3} fill={p[2] ? C.cyan : C.violet}
                  opacity={(0.25 + 0.35 * rnd(i + Math.floor(T * 15))) * draw} />
              ))}
              <rect x={0} y={1200 * (1 - scan) - 40} width={1000} height={40} fill={C.cyan} opacity={0.12 * draw} />
            </g>
            <g filter="url(#s2-g)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={hand.outline} stroke={C.cyan} strokeWidth={5 / Math.sqrt(Z)} pathLength={1} strokeDasharray={1}
                strokeDashoffset={1 - draw} />
              {hand.details.map((d, i) => (
                <path key={i} d={d} stroke={C.magenta} strokeWidth={3 / Math.sqrt(Z)} opacity={0.7 * draw} />
              ))}
            </g>
            <circle cx={P.x} cy={P.y} r={26 + 10 * Math.sin(T * 8)} fill="none" stroke={C.white} strokeWidth={2}
              opacity={prog(T, t0 + 0.2, EV.handZoom) * (1 - z)} />
          </g>
        )}
        {/* Ebene 2: Zellen */}
        {Z > 1.3 && Z < 60 && (
          <g transform={tr(9)} opacity={layerOp(Z / 9, 0.18, 0.5, 2.2, 4.5)} filter="url(#s2-g)">
            {CELLS.map((c, i) => (
              <g key={i} transform={`translate(${c.x},${c.y})`}>
                <circle r={c.r} fill="url(#s2-cell)" opacity={0.25} />
                <circle r={c.r} fill="none" stroke={c.k > 0.5 ? C.cyan : C.magenta} strokeWidth={2.5} opacity={0.8} />
                <circle cx={c.r * 0.2} cy={-c.r * 0.15} r={c.r * 0.3} fill={C.magenta} opacity={0.4} />
              </g>
            ))}
          </g>
        )}
        {/* Ebene 3: Atomgitter */}
        {Z > 5 && Z < ZMAX * 0.9 && (
          <g transform={tr(34)} opacity={layerOp(Z / 34, 0.2, 0.5, 1.3, 2.3)} filter="url(#s2-g)">
            {LATTICE.map((l, i) => (
              <g key={i}>
                <circle cx={l.x} cy={l.y} r={9} fill={i % 3 ? C.cyan : C.magenta} />
                <circle cx={l.x} cy={l.y} r={22} fill="none" stroke={C.cyan} strokeWidth={1} opacity={0.4} />
              </g>
            ))}
          </g>
        )}
        {/* Ebene 4: Atom */}
        {Z > 12 && (
          <g transform={`${tr(ZMAX)} rotate(${atomRot})`} opacity={atomOp}>
            {/* Leere: Messringe */}
            {e > 0 && [1, 2, 3, 4, 5].map((k) => (
              <circle key={k} r={k * 110 * orbS * 0.62} fill="none" stroke={C.cyan} strokeWidth={1}
                strokeDasharray="4 14" opacity={0.25 * e} />
            ))}
            {lp > 0.01 && <circle r={60 + 900 * (1 - Math.exp(-(T - EV.leer) * 3))} fill="none" stroke={C.magenta} strokeWidth={4} opacity={lp} />}
            <g filter="url(#s2-g)">
              {ORBITS.map((o, k) => (
                <ellipse key={k} rx={310 * orbS} ry={92 * orbS} transform={`rotate(${o.deg})`} fill="none"
                  stroke={k === 1 ? C.magenta : C.cyan} strokeWidth={2.2} opacity={0.55} />
              ))}
            </g>
            <g filter="url(#s2-g2)">
              {ORBITS.map((o, k) =>
                Array.from({length: 9}, (_, j) => {
                  const th = (T - j * 0.018) * o.w + o.ph;
                  const ex = Math.cos(th) * 310 * orbS, ey = Math.sin(th) * 92 * orbS;
                  const rad = (o.deg * Math.PI) / 180;
                  return (
                    <circle key={k * 10 + j} cx={ex * Math.cos(rad) - ey * Math.sin(rad)} cy={ex * Math.sin(rad) + ey * Math.cos(rad)}
                      r={(j === 0 ? 15 : 11 - j) * (0.8 + 0.2 * orbS)} fill={j === 0 ? 'url(#s2-el)' : C.cyan} opacity={j === 0 ? 1 : 0.5 * (1 - j / 9)} />
                  );
                }),
              )}
            </g>
            <Nucleus scale={nucS} T={T} idp="s2" />
          </g>
        )}
      </svg>
      {/* HUD für die Leere */}
      {e > 0.6 && (
        <div style={{position: 'absolute', top: 330, width: W, textAlign: 'center', fontFamily: 'Rajdhani', fontSize: 46,
          letterSpacing: 6, color: C.cyanSoft, opacity: clamp((e - 0.6) / 0.3), textShadow: `0 0 18px ${C.cyan}`}}>
          ≈ 99,9999999999996 % LEER
        </div>
      )}
    </AbsoluteFill>
  );
};
