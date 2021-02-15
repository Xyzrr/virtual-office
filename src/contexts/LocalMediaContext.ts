import React from 'react';

interface LocalMediaContextValue {
  localVideoInputEnabled: boolean;
  localAudioInputEnabled: boolean;
  localAudioOutputEnabled: boolean;
  localAudioTrack?: MediaStreamTrack;
  localVideoTrack?: MediaStreamTrack;
  localAudioInputDeviceId: string;
  localAudioOutputDeviceId: string;
  localVideoInputDeviceId: string;
  enableLocalVideoInput(): void;
  disableLocalVideoInput(): void;
  enableLocalAudioInput(): void;
  disableLocalAudioInput(): void;
  setLocalAudioOutputEnabled(enabled: boolean): void;
  setLocalAudioInputDeviceId(id: string): void;
  setLocalAudioOutputDeviceId(id: string): void;
  setLocalVideoInputDeviceId(id: string): void;
}

export const LocalMediaContext = React.createContext<LocalMediaContextValue>(
  {} as any
);
