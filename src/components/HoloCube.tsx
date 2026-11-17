import React from 'react';
import {C} from '../lib';

const V = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])));
const EDGES: [number, number][] = [];
for (let i = 0; i < 8; i++)
  for (let j = i + 1; j < 8; j++) {
    const d = V[i].reduce((s, v, k) => s + (v !== V[j][k] ? 1 : 0), 0);
    if (d === 1) EDGES.push([i, j]);
  }
const FACES = [
  [0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5],
];

/** Leuchtender Hologramm-Würfel mit echter 3D-Rotation (orthografische Projektion) */
export const HoloCube: React.FC<{
  x: number; y: number; size: number; rotY: number; rotX: number; glow?: number; filterId: string; core?: string;
}> = ({x, y, size, rotY, rotX, glow = 1, filterId, core = C.magenta}) => {
  const h = size / 2;
  const P = V.map(([vx, vy, vz]) => {
    const x1 = vx * Math.cos(rotY) + vz * Math.sin(rotY);
    const z1 = -vx * Math.sin(rotY) + vz * Math.cos(rotY);
    const y2 = vy * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = vy * Math.sin(rotX) + z1 * Math.cos(rotX);
    return [x + x1 * h, y + y2 * h, z2];
  });
  const faces = FACES.map((f) => {
    const pts = f.map((i) => P[i]);
    const [a, b, c] = pts;
    const nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const zc = pts.reduce((s, p) => s + p[2], 0) / 4;
    return {pts, zc, nz};
  }).sort((a, b) => b.zc - a.zc);
  return (
    <g>
      <circle cx={x} cy={y} r={size * 1.6} fill={`url(#${filterId}-halo)`} opacity={0.55 * glow} />
      <circle cx={x} cy={y} r={size * 0.42} fill={core} opacity={0.5 * glow} filter={`url(#${filterId})`} />
      {faces.map((f, i) => (
        <polygon key={i} points={f.pts.map((p) => `${p[0]},${p[1]}`).join(' ')}
          fill={f.zc < 0 ? 'rgba(0,240,255,0.10)' : 'rgba(255,43,214,0.05)'} />
      ))}
      <g filter={`url(#${filterId})`}>
        {EDGES.map(([i, j], k) => {
          const back = (P[i][2] + P[j][2]) / 2 > 0;
          return (
            <line key={k} x1={P[i][0]} y1={P[i][1]} x2={P[j][0]} y2={P[j][1]}
              stroke={back ? C.magenta : C.cyan} strokeWidth={back ? size * 0.018 : size * 0.035}
              strokeOpacity={back ? 0.5 : 1} strokeLinecap="round" />
          );
        })}
        {P.map((p, i) => (p[2] < 0.3 ? <circle key={i} cx={p[0]} cy={p[1]} r={size * 0.035} fill={C.white} /> : null))}
      </g>
    </g>
  );
};
