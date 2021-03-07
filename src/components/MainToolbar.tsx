import * as S from './MainToolbar.styles';
import React from 'react';

import { LocalMediaContext } from '../contexts/LocalMediaContext';
import ScreenSharePicker from './ScreenSharePicker';
import HiddenSelect from './HiddenSelect';
import circleButtonWithOptions from '../masks/circleButtonWithOptions.svg';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import AudioInputControl from './AudioInputControl';
import * as IconButtonStyles from './IconButton.styles';
import VideoInputControl from './VideoInputControl';

export interface MainToolbarProps {
  className?: string;
  minimized?: boolean;
  hide?: boolean;
}

const MainToolbar: React.FC<MainToolbarProps> = React.memo(
  ({ className, minimized, hide }) => {
    const [screenSharePickerOpen, setScreenSharePickerOpen] = React.useState(
      false
    );

    const {
      localAudioOutputDeviceId,
      setLocalAudioOutputDeviceId,
      localAudioOutputOn,
      setLocalAudioOutputOn,
      localScreenShareOn,
      setLocalScreenShareOn,
      setLocalScreenShareSourceId,
    } = React.useContext(LocalMediaContext);

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
        hide={mouseIsIdle || hide}
      >
        <AudioInputControl minimized={minimized} />
        <VideoInputControl minimized={minimized} />

        <IconButtonStyles.IconButton
          color={localAudioOutputOn ? undefined : 'danger'}
        >
          <IconButtonStyles.IconButtonBackground
            mask={minimized ? undefined : circleButtonWithOptions}
            onClick={() => {
              setLocalAudioOutputOn(!localAudioOutputOn);
            }}
          />
          <IconButtonStyles.IconButtonIcon
            name={localAudioOutputOn ? 'volume_up' : 'volume_off'}
          ></IconButtonStyles.IconButtonIcon>
          {!minimized && (
            <IconButtonStyles.CaretButtonWrapper>
              <IconButtonStyles.CaretButton />
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
            </IconButtonStyles.CaretButtonWrapper>
          )}
        </IconButtonStyles.IconButton>
        <IconButtonStyles.IconButton
          color={localScreenShareOn ? 'good' : undefined}
        >
          <IconButtonStyles.IconButtonBackground
            onClick={() => {
              if (localScreenShareOn) {
                setLocalScreenShareOn(false);
                return;
              }
              setScreenSharePickerOpen((o) => !o);
            }}
          ></IconButtonStyles.IconButtonBackground>
          <IconButtonStyles.IconButtonIcon
            name={localScreenShareOn ? 'stop_screen_share' : 'screen_share'}
          ></IconButtonStyles.IconButtonIcon>
        </IconButtonStyles.IconButton>
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
