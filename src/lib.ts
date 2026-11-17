import tl from './timeline.json';

export const FPS: number = tl.fps;
export const FRAMES: number = tl.durationInFrames;
export const DUR = FRAMES / FPS;
export const EV = tl.ev as Record<string, number>;
export const SC = tl.scenes as Record<string, [number, number]>;
export const FX = tl.fx as {t: number; type: 'punch' | 'flash' | 'glitch'; src: string}[];

export const W = 1080;
export const H = 1920;
export const CX = 540;
export const CY = 820; // visuelles Zentrum (Untertitel liegen darunter)

export const C = {
  bg: '#02030a',
  cyan: '#00f0ff',
  cyanSoft: '#7df9ff',
  magenta: '#ff2bd6',
  magentaSoft: '#ff8cf0',
  violet: '#7b5cff',
  white: '#f2fbff',
  pea: '#6bffc8',
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (T: number, a: number, b: number) => clamp((T - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** deterministischer Zufall 0..1 */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
/** Impuls: schneller Anstieg, exponentielles Abklingen */
export const pulse = (T: number, t0: number, tau: number, att = 0.03) =>
  T < t0 ? 0 : Math.min(1, (T - t0) / att) * Math.exp(-(T - t0) / tau);
/** organisches Rauschen aus inkommensurablen Sinuswellen */
export const wobble = (T: number, seed: number) =>
  Math.sin(T * 37.1 + seed * 11.3) * 0.5 + Math.sin(T * 53.7 + seed * 5.1) * 0.3 + Math.sin(T * 91.3 + seed * 2.7) * 0.2;
export const shake = (T: number, t0: number, amp: number, tau: number) => {
  const p = pulse(T, t0, tau, 0.015);
  return {x: wobble(T, 1 + t0) * amp * p, y: wobble(T, 7 + t0) * amp * p, r: wobble(T, 13 + t0) * amp * 0.06 * p};
};
export const fmtDE = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
