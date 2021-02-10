import React from 'react';

interface LocalMediaContextValue {
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  localAudioTrack?: MediaStreamTrack;
  localAudioInputDeviceId: string;
  localAudioOutputDeviceId: string;
  localVideoInputDeviceId: string;
  enableLocalVideo(): void;
  disableLocalVideo(): void;
  enableLocalAudio(): void;
  disableLocalAudio(): void;
  setLocalAudioInputDeviceId(id: string): void;
  setLocalAudioOutputDeviceId(id: string): void;
  setLocalVideoInputDeviceId(id: string): void;
}

export const LocalMediaContext = React.createContext<LocalMediaContextValue>(
  {} as any
);
