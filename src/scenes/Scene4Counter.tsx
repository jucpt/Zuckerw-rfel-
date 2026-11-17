import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {C, CX, CY, EV, FPS, H, SC, W, clamp, easeIn, easeInOut, fmtDE, lerp, prog, pulse, rnd, wobble} from '../lib';
import {Glow, HaloGrad, PersonSymbol} from '../components/Defs';
import {HoloCube} from '../components/HoloCube';

const N = 1500;
const CROWD = Array.from({length: N}, (_, i) => ({
  x: 30 + rnd(i + 77) * (W - 60),
  y: 270 + rnd(i + 177) * 1380,
  thr: rnd(i + 277),
  s: 0.38 + rnd(i + 377) * 0.3,
  col: rnd(i + 477) < 0.65 ? C.cyan : C.magenta,
}));
const SPARKS = Array.from({length: 60}, (_, i) => ({a: rnd(i + 5) * Math.PI * 2, v: 500 + rnd(i + 15) * 1300, s: 2 + rnd(i + 25) * 4}));

/** Zählerwert – identische Kurve wie die Tick-Sounds in make_sfx.py */
export const counterQ = (T: number) => {
  const p = prog(T, EV.counterStart, EV.counterEnd);
  return Math.pow(p, 1.9);
};

/** Szene 4: Zähler rast auf 8 Milliarden, Riser, Implosion zu einem winzigen Würfel */
export const Scene4Counter: React.FC<{T: number; frame: number}> = ({T, frame}) => {
  const t0 = SC.s4[0];
  const q = counterQ(T);
  const value = q <= 0 ? 0 : q >= 1 ? 8e9 : Math.pow(10, q * Math.log10(8e9));
  const rp = prog(T, EV.riserStart, EV.implode);
  const imp = easeIn(prog(T, EV.implode - 0.16, EV.implode));
  const after = T >= EV.implode;
  const tremble = 14 * rp * rp;
  const cam = 1 + 0.06 * rp + (after ? 0.4 * easeInOut(prog(T, EV.kaum, SC.s4[1])) : 0);
  const jx = wobble(T, 2) * tremble, jy = wobble(T, 5) * tremble;
  const eightPop = pulse(T, EV.eight, 0.25);
  const cubeSp = spring({frame: frame - Math.round(EV.implode * FPS), fps: FPS, config: {damping: 8, mass: 0.5}});
  const wPop = pulse(T, EV.wuerfel, 0.25) + pulse(T, EV.zucker2, 0.3);
  const cubeSize = 64 * cubeSp * (1 + 0.35 * wPop);
  const dt = T - EV.implode;
  const intro = clamp((T - t0) / 0.25);
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <defs>
          <Glow id="s4-g" sd={4} />
          <Glow id="s4-cube" sd={8} />
          <HaloGrad id="s4-cube-halo" color={C.cyan} />
          <HaloGrad id="s4-mh" color={C.magenta} />
          <PersonSymbol id="s4-person" />
        </defs>
        <g transform={`translate(${CX + jx},${CY + jy}) scale(${cam}) translate(${-CX},${-CY})`}>
          {!after && (
            <>
              {[0, 1, 2, 3, 4].map((k) => {
                const ph = ((T * (0.8 + 2.2 * rp) + k / 5) % 1 + 1) % 1;
                const rr = lerp(1000, 40, ph);
                return <circle key={k} cx={CX} cy={CY} r={rr} fill="none" stroke={k % 2 ? C.magenta : C.cyan}
                  strokeWidth={2 + 4 * rp} opacity={(0.12 + 0.5 * rp) * ph} />;
              })}
              <g filter="url(#s4-g)">
                {CROWD.map((p, i) => {
                  if (q < p.thr * 0.95) return null;
                  const pop = clamp((q - p.thr * 0.95) / 0.05);
                  const pullF = (1 - 0.22 * rp * rp) * (1 - imp);
                  const x = CX + (p.x - CX) * pullF + wobble(T, i) * 3 * rp;
                  const y = CY + (p.y - CY) * pullF + wobble(T, i + 0.5) * 3 * rp;
                  return <use key={i} href="#s4-person" transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(p.s * (0.4 + 0.6 * pop) * (1 - 0.6 * imp)).toFixed(3)})`}
                    fill={p.col} opacity={0.5 * pop + 0.3 * rp} />;
                })}
              </g>
              <circle cx={CX} cy={CY} r={200 + 500 * rp} fill="url(#s4-mh)" opacity={0.15 + 0.5 * rp} />
            </>
          )}
          {after && (
            <>
              {[0, 1].map((k) => {
                const r = (1 - Math.exp(-(dt - k * 0.12) * 2.6)) * 1100;
                return dt > k * 0.12 ? <circle key={k} cx={CX} cy={CY} r={r} fill="none" stroke={k ? C.magenta : C.cyan}
                  strokeWidth={10 * Math.exp(-dt * 2)} opacity={Math.exp(-dt * 1.6)} /> : null;
              })}
              <g filter="url(#s4-g)">
                {SPARKS.map((s, i) => {
                  const d = s.v * (1 - Math.exp(-dt * 3)) / 3;
                  return <circle key={i} cx={CX + Math.cos(s.a) * d} cy={CY + Math.sin(s.a) * d} r={s.s} fill={i % 2 ? C.cyan : C.white}
                    opacity={Math.exp(-dt * 1.5)} />;
                })}
              </g>
              <HoloCube x={CX} y={CY} size={cubeSize} rotY={1.1 * T} rotX={-0.6} glow={1.2 + wPop} filterId="s4-cube" />
              {/* HUD-Klammern */}
              <g opacity={clamp((T - EV.wuerfel) / 0.3)} fill="none" stroke={C.cyanSoft} strokeWidth={3} filter="url(#s4-g)">
                {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
                  <path key={i} d={`M${CX + sx * 110},${CY + sy * 80} L${CX + sx * 110},${CY + sy * 110} L${CX + sx * 80},${CY + sy * 110}`} />
                ))}
              </g>
            </>
          )}
        </g>
      </svg>
      {!after && (
        <div style={{position: 'absolute', top: 560 + jy, left: jx, width: W, textAlign: 'center', opacity: intro * (1 - imp),
          transform: `scale(${(1 + 0.15 * eightPop + 0.04 * rp) * (1 - 0.9 * imp)})`, transformOrigin: '540px 120px'}}>
          <div style={{fontFamily: 'Rajdhani', fontWeight: 700, fontSize: q >= 1 ? 158 : 150, color: q >= 1 ? C.white : C.cyan, letterSpacing: 2,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 20px ${C.cyan}, 0 0 60px ${q >= 1 ? C.magenta : 'rgba(0,240,255,0.5)'}, 0 4px 0 #000`}}>
            {fmtDE(value)}
          </div>
          <div style={{fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 50, letterSpacing: 22, color: C.magentaSoft, marginTop: -10,
            textShadow: `0 0 16px ${C.magenta}`}}>MENSCHEN</div>
        </div>
      )}
      {after && (
        <div style={{position: 'absolute', top: CY - 230, width: W, textAlign: 'center', fontFamily: 'Rajdhani', fontWeight: 700,
          fontSize: 42, letterSpacing: 6, color: C.cyanSoft, opacity: clamp((T - EV.wuerfel) / 0.3), textShadow: `0 0 14px ${C.cyan}`}}>
          8.000.000.000 MENSCHEN ≈ 1 CM³
        </div>
      )}
    </AbsoluteFill>
  );
};
