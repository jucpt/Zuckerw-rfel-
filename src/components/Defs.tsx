import React from 'react';
import {C} from '../lib';

/** Glow-Filter: zwei Unschärfe-Stufen + Original */
export const Glow: React.FC<{id: string; sd: number}> = ({id, sd}) => (
  <filter id={id} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation={sd} result="b1" />
    <feGaussianBlur in="SourceGraphic" stdDeviation={sd * 3} result="b2" />
    <feMerge>
      <feMergeNode in="b2" />
      <feMergeNode in="b1" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

/** Eigenes Menschen-Icon (ca. 38 Einheiten hoch, zentriert) */
export const PersonSymbol: React.FC<{id: string}> = ({id}) => (
  <symbol id={id} overflow="visible">
    <circle cx={0} cy={-13} r={5.4} />
    <path d="M-6.2,-5.6 Q0,-8.6 6.2,-5.6 L7.6,6 Q7.8,8.2 5.8,8.2 L4.1,8.2 L3.6,19 Q3.4,20.6 1.8,20.6 L0.9,20.6 L0,10.5 L-0.9,20.6 L-1.8,20.6 Q-3.4,20.6 -3.6,19 L-4.1,8.2 L-5.8,8.2 Q-7.8,8.2 -7.6,6 Z" />
  </symbol>
);

export const SphereGrad: React.FC<{id: string; color: string}> = ({id, color}) => (
  <radialGradient id={id} cx="35%" cy="32%" r="70%">
    <stop offset="0%" stopColor="#ffffff" />
    <stop offset="35%" stopColor={color} />
    <stop offset="100%" stopColor={color} stopOpacity={0.15} />
  </radialGradient>
);

export const HaloGrad: React.FC<{id: string; color: string}> = ({id, color}) => (
  <radialGradient id={id}>
    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
    <stop offset="30%" stopColor={color} stopOpacity={0.35} />
    <stop offset="100%" stopColor={color} stopOpacity={0} />
  </radialGradient>
);

export {C};
