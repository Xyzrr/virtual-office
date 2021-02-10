import React from 'react';

interface LocalMediaContextValue {
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  localAudioTrack?: MediaStreamTrack;
  enableLocalVideo(): void;
  disableLocalVideo(): void;
  enableLocalAudio(): void;
  disableLocalAudio(): void;
}

export const LocalMediaContext = React.createContext<LocalMediaContextValue>(
  {} as any
);
