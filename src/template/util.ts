import React, {createContext, useContext} from 'react';
import type {Resolved} from './types';

export const ReelCtx = createContext<Resolved | null>(null);
export const useReel = () => {
  const r = useContext(ReelCtx);
  if (!r) throw new Error('useReel außerhalb von <Reel>');
  return r;
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (T: number, a: number, b: number) => clamp((T - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** deterministischer Zufall 0..1 */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
/** schneller Anstieg, exponentielles Abklingen */
export const pulse = (T: number, t0: number, tau: number, att = 0.03) =>
  T < t0 ? 0 : Math.min(1, (T - t0) / att) * Math.exp(-(T - t0) / tau);
export const wobble = (T: number, seed: number) =>
  Math.sin(T * 37.1 + seed * 11.3) * 0.5 + Math.sin(T * 53.7 + seed * 5.1) * 0.3 + Math.sin(T * 91.3 + seed * 2.7) * 0.2;

/** Zahl im deutschen Format: 8.000.000.000 bzw. 3,5 */
export const fmtDE = (n: number, decimals = 0) =>
  n.toLocaleString('de-DE', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

/** Hex-Farbe mit Deckkraft */
export const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(f.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Leuchtender Text-Schatten */
export const neon = (color: string, k = 1) =>
  `0 0 ${14 * k}px ${color}, 0 0 ${40 * k}px ${alpha(color, 0.6)}, 0 6px 0 #000, 0 0 4px #000`;

/** Ein- und Ausblenden einer Szene */
export const sceneFade = (T: number, t0: number, t1: number, fadeIn = 0.18, fadeOut = 0.14) =>
  clamp((T - t0) / fadeIn) * clamp((t1 - T) / fadeOut);

/** Grobe Zeichenbreite (Großbuchstaben, schmale Headline-Schrift) relativ zur Schriftgröße */
export const charW = (s: string) =>
  [...s].reduce((a, ch) => a + (/[MWÜÖÄ@]/.test(ch) ? 0.62 : /[I1 .,:;!']/.test(ch) ? 0.3 : 0.5), 0);

/** größte Schriftgröße, bei der `words` in maxW x maxH passen */
export const fitSize = (words: string[], maxSize: number, maxW: number, maxH: number, minSize = 48) => {
  for (let size = maxSize; size >= minSize; size -= 4) {
    let lines = 1, lw = 0, ok = true;
    for (const w of words) {
      const ww = charW(w) * size;
      if (ww > maxW) { ok = false; break; }
      const add = (lw ? 0.28 * size : 0) + ww;
      if (lw + add > maxW) { lines++; lw = ww; } else lw += add;
    }
    if (ok && lines * size * 1.08 <= maxH) return size;
  }
  return minSize;
};

export type SceneProps<S> = {s: S & {t0: number; t1: number; times: Record<string, number>}; T: number; frame: number};
export {React};
