import React from 'react';

interface LocalMediaContextValue {
  localVideoInputOn: boolean;
  setLocalVideoInputOn(on: boolean): void;
  localVideoInputDeviceId?: string;
  setLocalVideoInputDeviceId(id: string): void;
  localVideoTrack?: MediaStreamTrack;
  localAudioInputOn: boolean;
  setLocalAudioInputOn(on: boolean): void;
  localAudioInputDeviceId?: string;
  setLocalAudioInputDeviceId(id: string): void;
  localAudioTrack?: MediaStreamTrack;
  localAudioOutputOn: boolean;
  setLocalAudioOutputOn(on: boolean): void;
  localAudioOutputDeviceId: string;
  setLocalAudioOutputDeviceId(id: string): void;
  localScreenShareOn: boolean;
  setLocalScreenShareOn(on: boolean): void;
  localScreenShareSourceId?: string;
  setLocalScreenShareSourceId(id: string): void;
}

export const LocalMediaContext = React.createContext<LocalMediaContextValue>(
  null!
);

export const LocalMediaContextProvider: React.FC = ({ children }) => {
  const [localVideoInputOn, setLocalVideoInputOn] = React.useState(true);
  const [localVideoInputDeviceId, setLocalVideoInputDeviceId] = React.useState<
    string | undefined
  >();
  const [localVideoTrack, setLocalVideoTrack] = React.useState<
    MediaStreamTrack | undefined
  >();

  const [localAudioInputOn, setLocalAudioInputOn] = React.useState(
    !process.env.NO_AUDIO
  );
  const [localAudioInputDeviceId, setLocalAudioInputDeviceId] = React.useState<
    string | undefined
  >();
  const [localAudioTrack, setLocalAudioTrack] = React.useState<
    MediaStreamTrack | undefined
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

  React.useEffect(() => {
    if (localVideoInputOn) {
      window.navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: { width: 1920, height: 1080 },
        })
        .then((mediaStream) => {
          setLocalVideoTrack(mediaStream.getVideoTracks()[0]);
        });
    } else {
      if (localVideoTrack) {
        localVideoTrack.stop();
        setLocalVideoTrack(undefined);
      }
    }
  }, [localVideoInputOn]);

  React.useEffect(() => {
    if (localAudioInputOn) {
      window.navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: false,
        })
        .then((mediaStream) => {
          setLocalAudioTrack(mediaStream.getAudioTracks()[0]);
        });
    } else {
      if (localAudioTrack) {
        localAudioTrack.stop();
        setLocalAudioTrack(undefined);
      }
    }
  }, [localAudioInputOn]);

  return (
    <LocalMediaContext.Provider
      value={{
        localVideoInputOn,
        setLocalVideoInputOn,
        localVideoInputDeviceId,
        setLocalVideoInputDeviceId,
        localVideoTrack,
        localAudioInputOn,
        setLocalAudioInputOn,
        localAudioTrack,
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
    </LocalMediaContext.Provider>
  );
};
