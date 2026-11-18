import React from 'react';
import {CalculateMetadataFunction, Composition} from 'remotion';
import beispiel from '../../reels/beispiel.json';
import {Reel, ReelProps} from './Reel';
import {loadTranscript, resolveConfig} from './resolve';
import type {ReelConfig} from './types';

/** Liest die Konfiguration (Standard: reels/beispiel.json, sonst per --props) und löst alle Zeiten auf */
const calculateMetadata: CalculateMetadataFunction<ReelProps> = async ({props}) => {
  const {resolved: _old, ...cfg} = props;
  const segments = cfg.subtitles?.transcript ? await loadTranscript(cfg.subtitles.transcript) : null;
  const resolved = resolveConfig(cfg as ReelConfig, segments);
  return {
    durationInFrames: Math.round(resolved.duration * resolved.fps),
    fps: resolved.fps,
    width: resolved.width,
    height: resolved.height,
    props: {...props, resolved},
  };
};

export const TemplateRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    defaultProps={beispiel as unknown as ReelConfig}
    calculateMetadata={calculateMetadata}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
  />
);
