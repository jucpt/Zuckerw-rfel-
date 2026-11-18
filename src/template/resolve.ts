import {staticFile} from 'remotion';
import type {Colors, FontDef, ReelConfig, Resolved, Segment, Zeit} from './types';

export const DEFAULT_COLORS: Colors = {
  background: '#02030a',
  primary: '#00f0ff',
  accent: '#ff2bd6',
  secondary: '#7b5cff',
  text: '#f2fbff',
};
const DEFAULT_FONTS: {headline: FontDef; body: FontDef} = {
  headline: {family: 'Anton', file: 'fonts/anton-latin-400-normal.woff2', weight: '400'},
  body: {family: 'Rajdhani', file: 'fonts/rajdhani-latin-700-normal.woff2', weight: '700'},
};
const SCENE_TYPES = ['title', 'counter', 'keyword', 'list', 'image', 'cta'];

export const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const fail = (msg: string): never => {
  throw new Error(`Reel-Konfiguration: ${msg}`);
};

/** Lädt das Whisper-Transkript aus public/ */
export const loadTranscript = async (file: string): Promise<Segment[]> => {
  const res = await fetch(staticFile(file));
  if (!res.ok) fail(`Transkript "${file}" nicht gefunden (muss in public/ liegen)`);
  const json = await res.json();
  return (json.segments ?? []).map((s: any) => ({
    words: (s.words ?? []).map((w: any) => ({text: String(w.word).trim(), start: w.start, end: w.end})),
  }));
};

const makeTimeResolver = (segments: Segment[] | null) => {
  const words = segments ? segments.flatMap((s) => s.words) : [];
  return (z: Zeit, where: string): number => {
    if (typeof z === 'number') return z;
    if (typeof z !== 'string') return fail(`${where}: Zeit fehlt`);
    const m = z.trim().match(/^(.+?)(?:#(\d+))?(\$)?([+-]\d+(?:\.\d+)?)?$/);
    if (!m) return fail(`${where}: Zeit "${z}" nicht lesbar`);
    if (!segments) return fail(`${where}: "${z}" verweist auf ein Wort, aber es ist kein Transkript angegeben`);
    const [, word, occ = '1', atEnd, offset = '0'] = m;
    const hits = words.filter((w) => norm(w.text) === norm(word));
    const hit = hits[Number(occ) - 1];
    if (!hit) return fail(`${where}: Wort "${word}" (${occ}. Vorkommen) nicht im Transkript`);
    return Math.round(((atEnd ? hit.end : hit.start) + Number(offset)) * 1000) / 1000;
  };
};

export const resolveConfig = (cfg: ReelConfig, segments: Segment[] | null): Resolved => {
  const fps = cfg.format?.fps ?? 30;
  const width = cfg.format?.width ?? 1080;
  const height = cfg.format?.height ?? 1920;
  const T = makeTimeResolver(segments);

  let duration: number;
  if (cfg.duration === 'auto') {
    if (!segments) fail('duration "auto" braucht ein Transkript (subtitles.transcript)');
    const last = segments!.flatMap((s) => s.words).pop();
    duration = (last?.end ?? 0) + 0.6;
  } else if (typeof cfg.duration === 'number' && cfg.duration > 0) {
    duration = cfg.duration;
  } else {
    duration = fail('duration fehlt (Sekunden oder "auto")');
  }
  // auf ganze Frames runden
  duration = Math.round(duration * fps) / fps;

  if (!Array.isArray(cfg.scenes) || cfg.scenes.length === 0) fail('scenes ist leer');
  const starts = cfg.scenes.map((s, i) => {
    if (!SCENE_TYPES.includes(s.type)) fail(`Szene ${i + 1}: unbekannter Typ "${(s as any).type}" (erlaubt: ${SCENE_TYPES.join(', ')})`);
    return T(s.start, `Szene ${i + 1} (${s.type}) start`);
  });
  starts.forEach((t, i) => {
    if (i > 0 && t < starts[i - 1]) fail(`Szene ${i + 1} beginnt vor Szene ${i} – Szenen müssen zeitlich sortiert sein`);
  });

  const scenes = cfg.scenes.map((s, i) => {
    const where = `Szene ${i + 1} (${s.type})`;
    const t0 = starts[i];
    const t1 = s.end !== undefined ? T(s.end, `${where} end`) : i + 1 < starts.length ? starts[i + 1] : duration;
    if (t1 <= t0) fail(`${where}: Ende liegt nicht nach dem Start`);
    const times: Record<string, number> = {};
    if (s.type === 'counter') {
      times.countUntil = s.countUntil !== undefined ? T(s.countUntil, `${where} countUntil`) : t0 + 0.7 * (t1 - t0);
    }
    if (s.type === 'list') {
      const n = s.items.length;
      s.items.forEach((it, k) => {
        const at = typeof it === 'object' && it.at !== undefined ? T(it.at, `${where} Punkt ${k + 1}`) : null;
        times[`item${k}`] = at ?? t0 + (s.title ? 0.5 : 0.15) + (k * (t1 - t0 - 0.8)) / Math.max(n, 1);
      });
    }
    return {...s, t0, t1, times};
  });

  const effects = (cfg.effects ?? []).map((e, i) => ({
    t: T(e.at, `Effekt ${i + 1}`), type: e.type, strength: e.strength ?? 1,
  }));
  // Übergänge der Szenen als Effekte
  scenes.forEach((s, i) => {
    const tr = s.transition ?? 'fade';
    if (i > 0 && (tr === 'glitch' || tr === 'flash' || tr === 'punch')) effects.push({t: s.t0, type: tr, strength: 1});
  });
  effects.sort((a, b) => a.t - b.t);

  const sounds = (cfg.audio?.sounds ?? []).map((s, i) => ({
    file: s.file, t: T(s.at, `Sound ${i + 1}`), volume: s.volume ?? 1,
  }));

  return {
    cfg, width, height, fps, duration,
    colors: {...DEFAULT_COLORS, ...(cfg.colors ?? {})},
    fonts: {headline: cfg.fonts?.headline ?? DEFAULT_FONTS.headline, body: cfg.fonts?.body ?? DEFAULT_FONTS.body},
    segments,
    scenes, effects, sounds,
    contentY: cfg.subtitles ? Math.round(height * 0.43) : Math.round(height * 0.5),
  };
};
