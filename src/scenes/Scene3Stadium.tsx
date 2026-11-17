import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {C, CX, CY, EV, FPS, H, SC, W, clamp, easeInOut, lerp, prog, pulse, rnd} from '../lib';
import {Glow, HaloGrad, SphereGrad} from '../components/Defs';
import {Nucleus} from './Scene2Atom';

const FW = 260, FH = 400; // halbe Spielfeldmaße
const ring = (rx: number, ry: number, n = 4) => {
  // Superellipse als Stadionring
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    pts.push(`${(Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * rx).toFixed(1)},${(Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * ry).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + ' Z';
};
const RINGS = [
  [330, 480], [370, 530], [420, 590], [470, 650], [520, 710], [570, 770],
];
const SEAT_LINES = Array.from({length: 72}, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  const c = Math.cos(a), s = Math.sin(a);
  const f = (rx: number, ry: number) => [Math.sign(c) * Math.pow(Math.abs(c), 0.5) * rx, Math.sign(s) * Math.pow(Math.abs(s), 0.5) * ry];
  const [x1, y1] = f(370, 530), [x2, y2] = f(570, 770);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`;
}).join(' ');
const CROWD = Array.from({length: 520}, (_, i) => {
  const a = rnd(i + 3) * Math.PI * 2, t = 0.1 + 0.85 * rnd(i + 9);
  const c = Math.cos(a), s = Math.sin(a);
  const rx = lerp(375, 565, t), ry = lerp(535, 765, t);
  return {x: Math.sign(c) * Math.pow(Math.abs(c), 0.5) * rx, y: Math.sign(s) * Math.pow(Math.abs(s), 0.5) * ry, k: rnd(i + 17)};
});
const LIGHTS = [[-560, -790], [560, -790], [-560, 790], [560, 790]];

/** Szene 3: Atomkern = Erbse, Atom = Fußballstadion. Kamera fährt weit heraus. */
export const Scene3Stadium: React.FC<{T: number; frame: number}> = ({T, frame}) => {
  const t0 = SC.s3[0];
  const pull = easeInOut(prog(T, EV.pullStart, EV.stadion + 0.7));
  const Zin = 30 * (1 + 0.35 * prog(T, t0, EV.pullStart));
  const Z = Math.exp(lerp(Math.log(Zin), Math.log(0.92), pull));
  const tilt = lerp(0, 52, easeInOut(prog(T, EV.pullStart + 0.6, EV.stadion + 1.2)));
  const rot = lerp(-28, 0, pull) + 2 * Math.sin(T * 0.7);
  const peaPop = spring({frame: frame - Math.round(EV.erbse * FPS), fps: FPS, config: {damping: 9, mass: 0.6}});
  const morph = clamp(peaPop);
  const lightsOn = pulse(T, EV.stadion, 0.9, 0.05);
  const lit = clamp(prog(T, EV.pullStart + 1.2, EV.stadion)) * 0.6 + 0.4 * lightsOn + 0.25;
  const ns = 'non-scaling-stroke' as const;
  const marker = clamp((7 - Z) / 4);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `perspective(1700px) rotateX(${tilt}deg)`, transformOrigin: `${CX}px ${CY}px`}}>
        <svg width={W} height={H} style={{overflow: 'visible'}}>
          <defs>
            <Glow id="s3-g" sd={4} />
            <Glow id="s3-g2" sd={9} />
            <SphereGrad id="s3-pea" color={C.pea} />
            <SphereGrad id="s3-sp" color={C.magenta} />
            <SphereGrad id="s3-sn" color={C.cyan} />
            <HaloGrad id="s3-nh" color={C.magenta} />
            <HaloGrad id="s3-peah" color={C.pea} />
            <HaloGrad id="s3-light" color={C.cyanSoft} />
          </defs>
          <g transform={`translate(${CX},${CY}) rotate(${rot}) scale(${Z})`}>
            {/* Rasen-Streifen */}
            {Array.from({length: 10}, (_, i) => (
              <rect key={i} x={-FW} y={-FH + i * 80} width={FW * 2} height={80} fill={i % 2 ? '#00f0ff' : '#00a0c0'} opacity={0.05 + 0.04 * lit} />
            ))}
            <g filter="url(#s3-g)" fill="none" stroke={C.cyan} strokeWidth={2.4} opacity={0.5 + 0.5 * lit}>
              <rect x={-FW} y={-FH} width={FW * 2} height={FH * 2} vectorEffect={ns} />
              <line x1={-FW} y1={0} x2={FW} y2={0} vectorEffect={ns} />
              <circle r={70} vectorEffect={ns} />
              {[-1, 1].map((s) => (
                <g key={s}>
                  <rect x={-150} y={s > 0 ? FH - 130 : -FH} width={300} height={130} vectorEffect={ns} />
                  <rect x={-70} y={s > 0 ? FH - 45 : -FH} width={140} height={45} vectorEffect={ns} />
                  <path d={`M-55,${s * (FH - 130)} A70,70 0 0 ${s > 0 ? 1 : 0} 55,${s * (FH - 130)}`} vectorEffect={ns} />
                  <rect x={-36} y={s > 0 ? FH : -FH - 14} width={72} height={14} stroke={C.white} vectorEffect={ns} />
                </g>
              ))}
            </g>
            <g filter="url(#s3-g)" fill="none" strokeWidth={2}>
              {RINGS.map(([rx, ry], i) => (
                <path key={i} d={ring(rx, ry)} stroke={i === RINGS.length - 1 ? C.magenta : i === 0 ? C.cyanSoft : C.cyan}
                  opacity={(i === RINGS.length - 1 ? 0.9 : 0.4) * (0.4 + 0.6 * lit)} vectorEffect={ns} strokeWidth={i === RINGS.length - 1 ? 3.5 : 1.6} />
              ))}
              <path d={SEAT_LINES} stroke={C.violet} opacity={0.55 * (0.4 + 0.6 * lit)} vectorEffect={ns} strokeWidth={1.2} />
            </g>
            {CROWD.map((c, i) => {
              const fl = (rnd(i * 3 + Math.floor(T * 12)) > 0.93 ? 1 : 0) * (0.4 + lightsOn);
              return <circle key={i} cx={c.x} cy={c.y} r={2.6 + 3 * fl} fill={c.k > 0.6 ? C.magenta : C.cyan} opacity={0.35 + 0.65 * fl} />;
            })}
            {LIGHTS.map(([x, y], i) => (
              <g key={i}>
                <path d={`M${x},${y} L${x * 0.25 - 120},${y * 0.25} L${x * 0.25 + 120},${y * 0.25} Z`} fill="url(#s3-light)" opacity={0.08 + 0.35 * lit} />
                <rect x={x - 22} y={y - 10} width={44} height={20} fill={C.white} filter="url(#s3-g2)" opacity={0.5 + 0.5 * lit} />
              </g>
            ))}
            {/* Kern -> Erbse */}
            <g opacity={1 - morph}>
              <Nucleus scale={0.11 * (1 + 0.1 * Math.sin(T * 6))} T={T} idp="s3" />
            </g>
            <g transform={`scale(${morph})`}>
              <circle r={14} fill="url(#s3-peah)" opacity={0.7} />
              <circle r={4.2} fill="url(#s3-pea)" />
            </g>
          </g>
        </svg>
      </div>
      {/* HUD: Markierung der winzigen Erbse */}
      {marker > 0 && (
        <svg width={W} height={H} style={{position: 'absolute'}}>
          <g opacity={marker} filter="url(#s3-g)" fill="none" stroke={C.pea} strokeWidth={3}>
            <circle cx={CX} cy={CY} r={30 + 6 * Math.sin(T * 10)} />
            <line x1={CX + 24} y1={CY - 24} x2={CX + 140} y2={CY - 140} />
            <line x1={CX + 140} y1={CY - 140} x2={CX + 330} y2={CY - 140} />
          </g>
          <text x={CX + 150} y={CY - 156} fill={C.pea} opacity={marker} fontFamily="Rajdhani" fontSize={40} letterSpacing={3}>ERBSE = KERN</text>
          <text x={CX} y={330} textAnchor="middle" fill={C.magentaSoft} opacity={marker} fontFamily="Rajdhani" fontSize={46} letterSpacing={6}
            style={{filter: `drop-shadow(0 0 12px ${C.magenta})`}}>STADION = ATOM</text>
        </svg>
      )}
    </AbsoluteFill>
  );
};
