import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import type {ImageScene} from '../types';
import {SceneProps, alpha, clamp, easeOut, lerp, sceneFade, useReel} from '../util';

const isVideo = (f: string) => /\.(mp4|webm|mov|m4v)$/i.test(f);

/** Bild oder Video aus public/ mit Ken-Burns-Zoom und optionaler Bildunterschrift */
export const Media: React.FC<SceneProps<ImageScene>> = ({s, T}) => {
  const {colors: C, fonts, fps, width: W, height: H, contentY} = useReel();
  const p = clamp((T - s.t0) / (s.t1 - s.t0));
  const zoom = lerp(s.zoomFrom ?? 1.05, s.zoomTo ?? 1.2, p);
  const px = (s.panX ?? 0) * p, py = (s.panY ?? 0) * p;
  const capP = easeOut(clamp((T - s.t0 - 0.3) / 0.4));
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
  return (
    <AbsoluteFill style={{opacity: sceneFade(T, s.t0, s.t1, 0.25, 0.2)}}>
      <AbsoluteFill style={{transform: `translate(${px}px, ${py}px) scale(${zoom})`}}>
        {isVideo(s.file) ? (
          <Sequence from={Math.round(s.t0 * fps)} layout="none">
            <OffthreadVideo src={staticFile(s.file)} muted style={style} />
          </Sequence>
        ) : (
          <Img src={staticFile(s.file)} style={style} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{
        background: `linear-gradient(180deg, ${alpha(C.background, 0.15)} 0%, ${alpha(C.background, s.darken ?? 0.35)} 55%, ${alpha(C.background, 0.9)} 100%)`,
      }} />
      {s.caption && (
        <div style={{
          position: 'absolute', left: W * 0.08, right: W * 0.08, top: Math.min(contentY + H * 0.2, H * 0.6),
          textAlign: 'center', fontFamily: fonts.headline.family, fontSize: 96, lineHeight: 1.05, color: C.text,
          opacity: capP, transform: `translateY(${(1 - capP) * 30}px)`,
          textShadow: `0 6px 0 #000, 0 0 30px ${alpha(C.primary, 0.6)}`, WebkitTextStroke: '1.5px #000',
        }}>{s.caption.toUpperCase()}</div>
      )}
    </AbsoluteFill>
  );
};
