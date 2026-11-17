import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, CX, EV, H, SC, W, clamp, easeOut, lerp, prog, pulse, rnd, shake} from '../lib';
import {Glow, HaloGrad} from '../components/Defs';
import {HoloCube} from '../components/HoloCube';

const HOR = 880; // Horizont
const IMP = {x: CX, y: 1080};
const VP = {x: CX, y: 700};
const CRACKS = Array.from({length: 18}, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + (rnd(i + 3) - 0.5) * 0.3;
  const len = 260 + rnd(i + 9) * 520;
  const pts: [number, number][] = [[0, 0]];
  let x = 0, y = 0, ang = a;
  for (let k = 1; k <= 7; k++) {
    ang += (rnd(i * 13 + k) - 0.5) * 0.7;
    x += Math.cos(ang) * len / 7; y += Math.sin(ang) * len / 7;
    pts.push([x, y]);
  }
  return pts;
});
const DEBRIS = Array.from({length: 80}, (_, i) => ({
  vx: (rnd(i + 1) - 0.5) * 1700, vy: -400 - rnd(i + 2) * 1500, s: 5 + rnd(i + 3) * 16, w: (rnd(i + 4) - 0.5) * 20,
  c: rnd(i + 5) < 0.5 ? C.cyan : rnd(i + 6) < 0.5 ? C.magenta : C.white,
}));

/** Szene 5: Würfel stürzt ab, Boden bricht, Kamera bebt, "500.000.000 t" knallt ins Bild */
export const Scene5Impact: React.FC<{T: number}> = ({T}) => {
  const t0 = SC.s5[0];
  const fall = prog(T, EV.fallStart, EV.impact);
  const hit = T >= EV.impact;
  const dt = T - EV.impact;
  const size = 190;
  const hover = 470 + 14 * Math.sin(T * 5);
  const lift = -40 * Math.sin(Math.PI * clamp(fall / 0.18));
  const groundY = IMP.y - size * 0.55;
  const cy = hit ? groundY + 26 * easeOut(clamp(dt / 0.2)) : lerp(hover, groundY, fall < 0.18 ? 0 : Math.pow((fall - 0.18) / 0.82, 2)) + lift;
  const sh = shake(T, EV.impact, 60, 0.5);
  const sh2 = shake(T, EV.millionen, 14, 0.25);
  const sh3 = shake(T, EV.tonnen, 28, 0.35);
  const sx = sh.x + sh2.x + sh3.x, sy = sh.y + sh2.y + sh3.y, sr = sh.r + sh2.r + sh3.r;
  const crackP = easeOut(prog(T, EV.impact, EV.impact + 0.4));
  const crack2 = easeOut(prog(T, EV.tonnen, EV.tonnen + 0.3));
  const intro = clamp((T - t0) / 0.3);
  const speed = fall > 0.18 && !hit ? (fall - 0.18) / 0.82 : 0;
  // Slam-Text
  const ts = hit ? 1 + 2.6 * Math.exp(-dt / 0.05) - 0.08 * Math.sin(dt * 40) * Math.exp(-dt / 0.15) : 0;
  const tp = pulse(T, EV.tonnen, 0.2) + 0.6 * pulse(T, EV.millionen, 0.2);
  const split = 3 + 16 * (Math.exp(-Math.max(0, dt) / 0.15) + tp);
  const floorLines: string[] = [];
  for (let k = -14; k <= 14; k++) floorLines.push(`M${VP.x + k * 18},${HOR} L${VP.x + k * 330},${H + 200}`);
  const hLines: number[] = [];
  for (let k = 0; k < 14; k++) hLines.push(HOR + 12 * Math.pow(1.42, k));
  const sag = (y: number) => (hit ? 30 * Math.exp(-Math.abs(y - IMP.y) / 60) * easeOut(clamp(dt / 0.25)) : 0);
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <defs>
          <Glow id="s5-g" sd={4} />
          <Glow id="s5-cube" sd={9} />
          <HaloGrad id="s5-cube-halo" color={C.cyan} />
          <HaloGrad id="s5-mh" color={C.magenta} />
          <linearGradient id="s5-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.magenta} stopOpacity={0.25} />
            <stop offset="1" stopColor={C.bg} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="s5-crater">
            <stop offset="0" stopColor="#000" stopOpacity={1} />
            <stop offset="0.7" stopColor="#000" stopOpacity={0.85} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${sx},${sy}) rotate(${sr} ${CX} 960)`} opacity={intro}>
          <rect x={-200} y={HOR} width={W + 400} height={H} fill="url(#s5-floor)" />
          <g filter="url(#s5-g)" stroke={C.cyan} fill="none" strokeWidth={1.6} opacity={0.6}>
            <path d={floorLines.join(' ')} />
            {hLines.map((y, i) => (
              <path key={i} d={`M-200,${y} L${IMP.x - 400},${y} Q${IMP.x},${y + sag(y) * 2.2} ${IMP.x + 400},${y} L${W + 200},${y}`} opacity={0.3 + i / 20} />
            ))}
          </g>
          <line x1={-200} y1={HOR} x2={W + 200} y2={HOR} stroke={C.magenta} strokeWidth={3} filter="url(#s5-g)" />
          {hit && (
            <>
              <ellipse cx={IMP.x} cy={IMP.y + 6} rx={240 * easeOut(clamp(dt / 0.15))} ry={70 * easeOut(clamp(dt / 0.15))} fill="url(#s5-crater)" />
              <g filter="url(#s5-g)" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {CRACKS.map((c, i) => {
                  const pts = c.map(([x, y]) => `${(IMP.x + x * 1.25).toFixed(1)},${(IMP.y + y * 0.34).toFixed(1)}`).join(' ');
                  const p = i % 3 === 0 ? Math.max(crackP * 0.6, crack2) : crackP;
                  return (
                    <g key={i}>
                      <polyline points={pts} stroke={C.magenta} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.9} />
                      <polyline points={pts} stroke={C.white} strokeWidth={2.2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
                    </g>
                  );
                })}
              </g>
              {[0, 1].map((k) => {
                const d2 = dt - k * 0.1;
                if (d2 < 0) return null;
                const r = 1100 * (1 - Math.exp(-d2 * 3));
                return <ellipse key={k} cx={IMP.x} cy={IMP.y} rx={r} ry={r * 0.28} fill="none" stroke={k ? C.magenta : C.cyan}
                  strokeWidth={14 * Math.exp(-d2 * 2.5)} opacity={Math.exp(-d2 * 2)} filter="url(#s5-g)" />;
              })}
              {DEBRIS.map((d, i) => {
                const tt = dt * 0.9;
                const x = IMP.x + d.vx * tt, y = IMP.y + d.vy * tt + 0.5 * 2600 * tt * tt;
                if (y > H + 50) return null;
                return <rect key={i} x={-d.s / 2} y={-d.s / 2} width={d.s} height={d.s * 0.6} fill={d.c}
                  transform={`translate(${x},${y}) rotate(${d.w * tt * 50})`} opacity={clamp(1.6 - dt)} />;
              })}
            </>
          )}
          {/* Fall-Streifen */}
          {speed > 0.05 && Array.from({length: 7}, (_, i) => (
            <line key={i} x1={CX - 90 + i * 30} y1={cy - 140 - 300 * speed} x2={CX - 90 + i * 30} y2={cy - 110} stroke={i % 2 ? C.cyan : C.magenta}
              strokeWidth={3} opacity={0.5 * speed} />
          ))}
          <circle cx={CX} cy={IMP.y} r={520} fill="url(#s5-mh)" opacity={hit ? 0.7 * Math.exp(-dt * 0.9) + 0.15 : 0.12 + 0.3 * speed} />
          <HoloCube x={CX} y={cy} size={size} rotY={hit ? 0.3 * T + 2.4 : T * (1.2 + 3 * speed)} rotX={-0.5} glow={1.1 + (hit ? Math.exp(-dt * 2) : 0)} filterId="s5-cube" />
        </g>
      </svg>
      {hit && (
        <div style={{position: 'absolute', top: 330 + sy * 0.6, left: sx * 0.6, width: W, height: 260, display: 'flex',
          alignItems: 'center', justifyContent: 'center', transform: `scale(${ts * (1 + 0.12 * tp)}) rotate(-3deg)`}}>
          {[[C.magenta, split, 0.85], [C.cyan, -split, 0.85], [C.white, 0, 1]].map(([col, off, o], i) => (
            <div key={i} style={{position: 'absolute', fontFamily: 'Anton', fontSize: 168, letterSpacing: 2, color: col as string,
              transform: `translateX(${off}px)`, opacity: o as number, mixBlendMode: i < 2 ? 'screen' : 'normal',
              textShadow: i === 2 ? `0 0 30px ${C.magenta}, 0 0 80px rgba(255,43,214,0.6), 0 8px 0 #000` : undefined,
              WebkitTextStroke: i === 2 ? '3px #12001a' : undefined}}>500.000.000 t</div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
