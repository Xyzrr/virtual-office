import * as S from './MainToolbar.styles';
import React from 'react';

import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { useVolume } from '../util/useVolume';
import ScreenSharePicker from './ScreenSharePicker';
import HiddenSelect from './HiddenSelect';
import VolumeIndicator from './VolumeIndicator';
import circleButtonWithOptions from '../masks/circleButtonWithOptions.svg';
import { useMouseIsIdle } from '../util/useMouseIsIdle';

export interface MainToolbarProps {
  className?: string;
  minimized?: boolean;
}

const MainToolbar: React.FC<MainToolbarProps> = React.memo(
  ({ className, minimized }) => {
    const [screenSharePickerOpen, setScreenSharePickerOpen] = React.useState(
      false
    );

    const {
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
    } = React.useContext(LocalMediaContext);

    const recentlyLoudTimerRef = React.useRef<number | null>(null);
    const [recentlyLoud, setRecentlyLoud] = React.useState(false);
    const [volume, setVolume] = React.useState(0);

    useVolume(localAudioTrack, (v) => {
      setVolume(v);
      if (v > 0.15) {
        if (recentlyLoudTimerRef.current != null) {
          window.clearTimeout(recentlyLoudTimerRef.current);
          recentlyLoudTimerRef.current = null;
        }

        setRecentlyLoud(true);

        recentlyLoudTimerRef.current = window.setTimeout(() => {
          setRecentlyLoud(false);
          recentlyLoudTimerRef.current = null;
        }, 500);
      }
    });

    const [mediaDevices, setMediaDevices] = React.useState<MediaDeviceInfo[]>(
      []
    );

    React.useEffect(() => {
      const updateDevices = () => {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          setMediaDevices(devices);
        });
      };

      navigator.mediaDevices.addEventListener('ondevicechange', updateDevices);
      updateDevices();

      return () => {
        navigator.mediaDevices.removeEventListener(
          'ondevicechange',
          updateDevices
        );
      };
    }, []);

    const mouseIsIdle = useMouseIsIdle();

    return (
      <S.Wrapper
        className={className}
        minimized={minimized}
        hidden={mouseIsIdle}
      >
        <S.IconButton color={localAudioInputOn ? undefined : 'danger'}>
          <S.IconButtonBackground
            mask={minimized ? undefined : circleButtonWithOptions}
            onClick={() => {
              setLocalAudioInputOn(!localAudioInputOn);
            }}
          />
          {localAudioInputOn ? (
            <VolumeIndicator volume={volume}></VolumeIndicator>
          ) : (
            <S.IconButtonIcon name="mic_off"></S.IconButtonIcon>
          )}
          {!minimized && (
            <S.CaretButtonWrapper>
              <S.CaretButton />
              <HiddenSelect
                onChange={(e) => {
                  const { value } = e.target;
                  setLocalAudioInputDeviceId(value);
                }}
                value={
                  localAudioInputDeviceId ||
                  localAudioTrack?.getSettings().deviceId
                }
              >
                {mediaDevices
                  .filter((device) => device.kind === 'audioinput')
                  .map((device) => {
                    return (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    );
                  })}
              </HiddenSelect>
            </S.CaretButtonWrapper>
          )}
        </S.IconButton>

        <S.IconButton color={localVideoInputOn ? undefined : 'danger'}>
          <S.IconButtonBackground
            mask={minimized ? undefined : circleButtonWithOptions}
            onClick={() => {
              setLocalVideoInputOn(!localVideoInputOn);
            }}
          />
          <S.IconButtonIcon
            name={localVideoInputOn ? 'videocam' : 'videocam_off'}
          ></S.IconButtonIcon>
          {!minimized && (
            <S.CaretButtonWrapper>
              <S.CaretButton />
              <HiddenSelect
                onChange={(e) => {
                  const { value } = e.target;
                  setLocalVideoInputDeviceId(value);
                }}
                value={
                  localVideoInputDeviceId ||
                  localVideoTrack?.getSettings().deviceId
                }
              >
                {mediaDevices
                  .filter((device) => device.kind === 'videoinput')
                  .map((device) => {
                    return (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    );
                  })}
              </HiddenSelect>
            </S.CaretButtonWrapper>
          )}
        </S.IconButton>
        <S.IconButton color={localAudioOutputOn ? undefined : 'danger'}>
          <S.IconButtonBackground
            mask={minimized ? undefined : circleButtonWithOptions}
            onClick={() => {
              setLocalAudioOutputOn(!localAudioOutputOn);
            }}
          />
          <S.IconButtonIcon
            name={localAudioOutputOn ? 'volume_up' : 'volume_off'}
          ></S.IconButtonIcon>
          {!minimized && (
            <S.CaretButtonWrapper>
              <S.CaretButton />
              <HiddenSelect
                onChange={(e) => {
                  const { value } = e.target;
                  setLocalAudioOutputDeviceId(value);
                }}
                value={localAudioOutputDeviceId}
              >
                {mediaDevices
                  .filter((device) => device.kind === 'audiooutput')
                  .map((device) => {
                    return (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    );
                  })}
              </HiddenSelect>
            </S.CaretButtonWrapper>
          )}
        </S.IconButton>
        <S.IconButton color={localScreenShareOn ? 'good' : undefined}>
          <S.IconButtonBackground
            onClick={() => {
              if (localScreenShareOn) {
                setLocalScreenShareOn(false);
                return;
              }
              setScreenSharePickerOpen((o) => !o);
            }}
          ></S.IconButtonBackground>
          <S.IconButtonIcon
            name={localScreenShareOn ? 'stop_screen_share' : 'screen_share'}
          ></S.IconButtonIcon>
        </S.IconButton>
        <ScreenSharePicker
          open={screenSharePickerOpen}
          onClose={() => {
            setScreenSharePickerOpen(false);
          }}
          onStart={(id) => {
            console.log('Started sharing screen', id);
            setScreenSharePickerOpen(false);
            setLocalScreenShareSourceId(id);
            setLocalScreenShareOn(true);
          }}
        ></ScreenSharePicker>
      </S.Wrapper>
    );
  }
);

export default MainToolbar;
