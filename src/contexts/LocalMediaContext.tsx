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
  localScreenShareSourceId?: string;
  enableLocalVideoInput(): void;
  disableLocalVideoInput(): void;
  enableLocalAudioInput(): void;
  disableLocalAudioInput(): void;
  setLocalAudioOutputEnabled(enabled: boolean): void;
  setLocalAudioInputDeviceId(id: string): void;
  setLocalAudioOutputDeviceId(id: string): void;
  setLocalVideoInputDeviceId(id: string): void;
  screenShare(id: string): void;
  stopScreenShare(): void;
}

export const LocalMediaContext = React.createContext<LocalMediaContextValue>(
  null!
);

interface LocalMediaContextValue2 {
  localVideoInputOn: boolean;
  setLocalVideoInputOn(on: boolean): void;
  localVideoInputDeviceId?: string;
  setLocalVideoInputDeviceId(id: string): void;
  localAudioInputOn: boolean;
  setLocalAudioInputOn(on: boolean): void;
  localAudioInputDeviceId?: string;
  setLocalAudioInputDeviceId(id: string): void;
  localAudioOutputOn: boolean;
  setLocalAudioOutputOn(on: boolean): void;
  localAudioOutputDeviceId: string;
  setLocalAudioOutputDeviceId(id: string): void;
  localScreenShareOn: boolean;
  setLocalScreenShareOn(on: boolean): void;
  localScreenShareSourceId?: string;
  setLocalScreenShareSourceId(id: string): void;
}

export const LocalMediaContext2 = React.createContext<LocalMediaContextValue2>(
  null!
);

export const LocalMediaContextProvider: React.FC = ({ children }) => {
  const [localVideoInputOn, setLocalVideoInputOn] = React.useState(true);
  const [localVideoInputDeviceId, setLocalVideoInputDeviceId] = React.useState<
    string | undefined
  >();
  const [localAudioInputOn, setLocalAudioInputOn] = React.useState(true);
  const [localAudioInputDeviceId, setLocalAudioInputDeviceId] = React.useState<
    string | undefined
  >();
  const [localAudioOutputOn, setLocalAudioOutputOn] = React.useState(true);
  const [
    localAudioOutputDeviceId,
    setLocalAudioOutputDeviceId,
  ] = React.useState('default');

  const [localScreenShareOn, setLocalScreenShareOn] = React.useState(false);
  const [
    localScreenShareSourceId,
    setLocalScreenShareSourceId,
  ] = React.useState<string | undefined>();

  return (
    <LocalMediaContext2.Provider
      value={{
        localVideoInputOn,
        setLocalVideoInputOn,
        localVideoInputDeviceId,
        setLocalVideoInputDeviceId,
        localAudioInputOn,
        setLocalAudioInputOn,
        localAudioOutputDeviceId,
        setLocalAudioOutputDeviceId,
        localAudioOutputOn,
        setLocalAudioOutputOn,
        localAudioInputDeviceId,
        setLocalAudioInputDeviceId,
        localScreenShareOn,
        setLocalScreenShareOn,
        localScreenShareSourceId,
        setLocalScreenShareSourceId,
      }}
    >
      {children}
    </LocalMediaContext2.Provider>
  );
};
