import React from 'react';
import {AbsoluteFill, Audio, Loop, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import type {AudioTrack, ReelConfig, Resolved} from './types';
import {ReelCtx} from './util';
import {Background} from './components/Background';
import {Camera, FXOverlay} from './components/FX';
import {Subtitles} from './components/Subtitles';
import {Title} from './scenes/Title';
import {Counter} from './scenes/Counter';
import {Keyword} from './scenes/Keyword';
import {List} from './scenes/List';
import {Media} from './scenes/Media';
import {Cta} from './scenes/Cta';

const SCENES: Record<string, React.FC<any>> = {title: Title, counter: Counter, keyword: Keyword, list: List, image: Media, cta: Cta};

const loaded = new Set<string>();
const ensureFonts = (r: Resolved) => {
  for (const f of [r.fonts.headline, r.fonts.body]) {
    const key = `${f.family}|${f.file}`;
    if (loaded.has(key)) continue;
    loaded.add(key);
    loadFont({family: f.family, url: staticFile(f.file), weight: f.weight ?? '400'});
  }
};

/** Musik/Stimme mit Lautstärke und Ein-/Ausblendung */
const Track: React.FC<{t: AudioTrack; fps: number; frames: number}> = ({t, fps, frames}) => {
  const vol = t.volume ?? 1;
  const fi = (t.fadeIn ?? 0) * fps, fo = (t.fadeOut ?? 0) * fps;
  const volume = (f: number) =>
    vol * (fi > 0 ? interpolate(f, [0, fi], [0, 1], {extrapolateRight: 'clamp'}) : 1)
        * (fo > 0 ? interpolate(f, [frames - fo, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1);
  const audio = <Audio src={staticFile(t.file)} volume={volume} startFrom={Math.round((t.startFrom ?? 0) * fps)} />;
  return t.loop ? <Loop durationInFrames={frames}>{audio}</Loop> : audio;
};

/** Props = die Konfiguration selbst (damit `--props=reels/x.json` direkt funktioniert) */
export type ReelProps = ReelConfig & {resolved?: Resolved};

export const Reel: React.FC<ReelProps> = ({resolved}) => {
  const frame = useCurrentFrame();
  if (!resolved) return null;
  const r = resolved;
  ensureFonts(r);
  const T = frame / r.fps;
  const frames = Math.round(r.duration * r.fps);
  const audio = r.cfg.audio ?? {};
  return (
    <ReelCtx.Provider value={r}>
      <AbsoluteFill style={{background: r.colors.background, overflow: 'hidden'}}>
        <Background T={T} />
        <Camera T={T}>
          {r.scenes.map((s, i) => {
            if (T < s.t0 || T >= s.t1) return null;
            const C = SCENES[s.type];
            return <C key={i} s={s} T={T} frame={frame} />;
          })}
        </Camera>
        <FXOverlay T={T} />
        {r.cfg.subtitles && <Subtitles T={T} frame={frame} />}
        {audio.music && <Track t={audio.music} fps={r.fps} frames={frames} />}
        {audio.voice && <Track t={audio.voice} fps={r.fps} frames={frames} />}
        {r.sounds.map((s, i) => (
          <Sequence key={i} from={Math.round(s.t * r.fps)} layout="none">
            <Audio src={staticFile(s.file)} volume={s.volume} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </ReelCtx.Provider>
  );
};
