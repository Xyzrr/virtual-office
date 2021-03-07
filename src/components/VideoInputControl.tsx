import * as S from './VideoInputControl.styles';
import * as IconButtonStyles from './IconButton.styles';
import React from 'react';
import circleButtonWithOptions from '../masks/circleButtonWithOptions.svg';
import HiddenSelect from './HiddenSelect';
import { LocalMediaContext } from '../contexts/LocalMediaContext';

export interface VideoInputControlProps {
  className?: string;
  minimized?: boolean;
}

const VideoInputControl: React.FC<VideoInputControlProps> = ({
  className,
  minimized,
}) => {
  const [mediaDevices, setMediaDevices] = React.useState<MediaDeviceInfo[]>([]);

  const {
    localVideoInputOn,
    setLocalVideoInputOn,
    localVideoTrack,
    localVideoInputDeviceId,
    setLocalVideoInputDeviceId,
  } = React.useContext(LocalMediaContext);

  React.useEffect(() => {
    const updateDevices = () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setMediaDevices(devices.filter((d) => d.kind === 'videoinput'));
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

  return (
    <IconButtonStyles.IconButton
      className={className}
      color={localVideoInputOn ? undefined : 'danger'}
    >
      <IconButtonStyles.IconButtonBackground
        mask={minimized ? undefined : circleButtonWithOptions}
        onClick={() => {
          setLocalVideoInputOn(!localVideoInputOn);
        }}
      />
      <IconButtonStyles.IconButtonIcon
        name={localVideoInputOn ? 'videocam' : 'videocam_off'}
      ></IconButtonStyles.IconButtonIcon>
      {!minimized && (
        <IconButtonStyles.CaretButtonWrapper>
          <IconButtonStyles.CaretButton />
          <HiddenSelect
            onChange={(e) => {
              const { value } = e.target;
              setLocalVideoInputDeviceId(value);
            }}
            value={
              localVideoInputDeviceId || localVideoTrack?.getSettings().deviceId
            }
          >
            {mediaDevices.map((device) => {
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
  );
};

export default VideoInputControl;
