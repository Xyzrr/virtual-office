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
import { ipcRenderer } from 'electron';
import PermissionHelperWindow from './PermissionHelperWindow';

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
    const [
      screenPermissionHelperOpen,
      setScreenPermissionHelperOpen,
    ] = React.useState(false);

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
            onClick={async () => {
              if (localScreenShareOn) {
                setLocalScreenShareOn(false);
                return;
              }
              if (!screenSharePickerOpen) {
                const screenAccess = await ipcRenderer.invoke(
                  'getMediaAccessStatus',
                  'screen'
                );
                if (screenAccess === 'granted') {
                  setScreenSharePickerOpen(true);
                } else {
                  setScreenPermissionHelperOpen(true);
                }
              } else {
                setScreenSharePickerOpen(false);
              }
            }}
          ></IconButtonStyles.IconButtonBackground>
          <IconButtonStyles.IconButtonIcon
            name={localScreenShareOn ? 'stop_screen_share' : 'screen_share'}
          ></IconButtonStyles.IconButtonIcon>
        </IconButtonStyles.IconButton>
        {screenPermissionHelperOpen && (
          <PermissionHelperWindow
            onClose={() => {
              setScreenPermissionHelperOpen(false);
            }}
            onGranted={() => {
              setScreenPermissionHelperOpen(false);
              setScreenSharePickerOpen(true);
            }}
          />
        )}
        {screenSharePickerOpen && (
          <ScreenSharePicker
            onClose={() => {
              setScreenSharePickerOpen(false);
            }}
            onStart={(id) => {
              console.log('Started sharing screen', id);
              setScreenSharePickerOpen(false);
              setLocalScreenShareSourceId(id);
              setLocalScreenShareOn(true);
            }}
          />
        )}
      </S.Wrapper>
    );
  }
);

export default MainToolbar;
