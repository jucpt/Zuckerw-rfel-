import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {DUR, EV, FPS, SC, clamp, easeInOut} from './lib';
import {Background} from './components/Background';
import {FXOverlay, cameraStyle} from './components/FXLayer';
import {Subtitles} from './components/Subtitles';
import {Scene1Humanity} from './scenes/Scene1Humanity';
import {Scene2Atom} from './scenes/Scene2Atom';
import {Scene3Stadium} from './scenes/Scene3Stadium';
import {Scene4Counter} from './scenes/Scene4Counter';
import {Scene5Impact} from './scenes/Scene5Impact';
import {Scene6Hand} from './scenes/Scene6Hand';

const inScene = (T: number, k: keyof typeof SC) => T >= SC[k][0] && T < SC[k][1];

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const T = frame / FPS;
  // Loop: am Ende blendet Szene 1 (mit negativer Zeit) ein -> letzter Frame ≈ erster Frame
  const loopMix = easeInOut(clamp((T - EV.loopStart) / (DUR - 1 / FPS - EV.loopStart)));
  return (
    <AbsoluteFill style={{background: '#02030a'}}>
      <Background T={T} />
      <AbsoluteFill style={cameraStyle(T)}>
        {inScene(T, 's1') && <Scene1Humanity T={T} />}
        {inScene(T, 's2') && <Scene2Atom T={T} />}
        {inScene(T, 's3') && <Scene3Stadium T={T} frame={frame} />}
        {inScene(T, 's4') && <Scene4Counter T={T} frame={frame} />}
        {inScene(T, 's5') && <Scene5Impact T={T} />}
        {inScene(T, 's6') && <Scene6Hand T={T} />}
        {loopMix > 0 && (
          <AbsoluteFill style={{opacity: loopMix}}>
            <Scene1Humanity T={T - DUR} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      <FXOverlay T={T} />
      <Subtitles T={T} frame={frame} />
      <Audio src={staticFile('voice.mp3')} volume={1} />
      <Audio src={staticFile('sfx.wav')} volume={0.75} />
    </AbsoluteFill>
  );
};
