import React from 'react';

interface LocalMediaContextValue {
  localVideoInputEnabled: boolean;
  localAudioInputEnabled: boolean;
  localAudioOutputEnabled: boolean;
  localScreenShareEnabled: boolean;
  localAudioTrack?: MediaStreamTrack;
  localVideoTrack?: MediaStreamTrack;
  localScreenVideoTrack?: MediaStreamTrack;
  localAudioInputDeviceId?: string;
  localAudioOutputDeviceId: string;
  localVideoInputDeviceId?: string;
  localScreenShareDisplayId?: string;
  enableLocalVideoInput(): void;
  disableLocalVideoInput(): void;
  enableLocalAudioInput(): void;
  disableLocalAudioInput(): void;
  setLocalAudioOutputEnabled(enabled: boolean): void;
  setLocalAudioInputDeviceId(id: string): void;
  setLocalAudioOutputDeviceId(id: string): void;
  setLocalVideoInputDeviceId(id: string): void;
  screenShare(id: string, displayId?: string): void;
  stopScreenShare(): void;
}

export const LocalMediaContext = React.createContext<LocalMediaContextValue>(
  {} as any
);
