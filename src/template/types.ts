/**
 * Aufbau einer Reel-Konfiguration (reels/*.json).
 *
 * Zeitangaben (Typ `Zeit`) dürfen sein:
 *   - eine Zahl in Sekunden:            4.5
 *   - ein Wort aus dem Transkript:      "zuckerwürfel"   (1. Vorkommen, Wortanfang)
 *   - ein bestimmtes Vorkommen:         "zuckerwürfel#2"
 *   - Wortende statt Wortanfang:        "zuckerwürfel$"  bzw. "zuckerwürfel#2$"
 *   - mit Versatz in Sekunden:          "zuckerwürfel-0.2" bzw. "witz+0.1"
 */
export type Zeit = number | string;

export type FontDef = {family: string; file: string; weight?: string};

export type AudioTrack = {
  file: string; // Datei in public/
  volume?: number; // 0..1, Standard 1
  fadeIn?: number; // Sekunden
  fadeOut?: number; // Sekunden
  startFrom?: number; // Sekunden, ab wo die Datei abgespielt wird
  loop?: boolean;
};

export type SoundCue = {file: string; at: Zeit; volume?: number};

export type EffectType = 'punch' | 'flash' | 'glitch' | 'shake';
export type EffectDef = {at: Zeit; type: EffectType; strength?: number};

export type Transition = 'cut' | 'fade' | 'glitch' | 'flash' | 'punch';

type SceneBase = {
  start: Zeit;
  end?: Zeit; // Standard: Start der nächsten Szene bzw. Videoende
  transition?: Transition; // Effekt beim Szenenstart, Standard "fade"
};

export type TitleScene = SceneBase & {type: 'title'; kicker?: string; title: string; subtitle?: string};
export type CounterScene = SceneBase & {
  type: 'counter'; from?: number; to: number; prefix?: string; suffix?: string; label?: string;
  countUntil?: Zeit; // wann der Zähler sein Ziel erreicht, Standard: 70 % der Szene
  curve?: 'linear' | 'ease' | 'log'; decimals?: number;
};
export type KeywordScene = SceneBase & {type: 'keyword'; text: string; subtext?: string; color?: string};
export type ListScene = SceneBase & {
  type: 'list'; title?: string;
  items: (string | {text: string; at?: Zeit})[]; // ohne `at` gleichmäßig verteilt
};
export type ImageScene = SceneBase & {
  type: 'image'; file: string; // Bild oder Video in public/
  caption?: string; zoomFrom?: number; zoomTo?: number; panX?: number; panY?: number; darken?: number;
};
export type CtaScene = SceneBase & {type: 'cta'; title: string; handle?: string; button?: string};

export type SceneDef = TitleScene | CounterScene | KeywordScene | ListScene | ImageScene | CtaScene;

export type ReelConfig = {
  id?: string;
  format?: {width?: number; height?: number; fps?: number};
  duration: number | 'auto'; // Sekunden; "auto" = Ende des Transkripts + 0.6 s
  colors?: Partial<Colors>;
  fonts?: {headline?: FontDef; body?: FontDef};
  audio?: {music?: AudioTrack | null; voice?: AudioTrack | null; sounds?: SoundCue[]};
  subtitles?: null | {
    transcript: string; // Whisper-JSON in public/ (segments[].words[] mit word/start/end)
    maxWords?: number; // Standard 3
    keywords?: string[]; // werden groß und einzeln gezeigt, auch Wortgruppen wie "8 milliarden"
    uppercase?: boolean; // Standard true
  };
  background?: {stars?: number; nebula?: boolean; scanlines?: boolean; vignette?: boolean};
  effects?: EffectDef[];
  scenes: SceneDef[];
};

export type Colors = {
  background: string; primary: string; accent: string; secondary: string; text: string;
};

export type Word = {text: string; start: number; end: number};
export type Segment = {words: Word[]};

/** Alle Zeiten in Sekunden aufgelöst – das bekommen die Komponenten */
export type Resolved = {
  cfg: ReelConfig;
  width: number; height: number; fps: number; duration: number;
  colors: Colors;
  fonts: {headline: FontDef; body: FontDef};
  segments: Segment[] | null;
  scenes: (SceneDef & {t0: number; t1: number; times: Record<string, number>})[];
  effects: {t: number; type: EffectType; strength: number}[];
  sounds: {file: string; t: number; volume: number}[];
  contentY: number; // vertikale Bildmitte für Szeneninhalt
};
