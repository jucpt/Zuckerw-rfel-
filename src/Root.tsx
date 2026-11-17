import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Reel} from './Reel';
import {FPS, FRAMES} from './lib';

loadFont({family: 'Anton', url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'Rajdhani', url: staticFile('fonts/rajdhani-latin-700-normal.woff2'), weight: '700'});

export const RemotionRoot: React.FC = () => (
  <Composition id="Zuckerwuerfel" component={Reel} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
);
