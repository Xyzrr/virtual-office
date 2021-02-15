import * as S from './RemoteUserPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React, { useContext } from 'react';
import { useVolume } from '../util/useVolume';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import HoverMenu from './HoverMenu';

export interface RemoteUserPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  audioEnabled: boolean;
  volumeMultiplier: number;
  expanded?: boolean;
  onSetExpanded(value: boolean): void;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  videoTrack,
  audioTrack,
  audioEnabled,
  volumeMultiplier,
  expanded,
  onSetExpanded,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [recentlyLoud, setRecentlyLoud] = React.useState(false);
  const recentlyLoudTimerRef = React.useRef<number | null>(null);

  const { localAudioOutputDeviceId, localAudioOutputEnabled } = useContext(
    LocalMediaContext
  );

  React.useEffect(() => {
    if (videoRef.current == null) {
      return;
    }

    (videoRef.current as any).setSinkId(localAudioOutputDeviceId);
  }, [localAudioOutputDeviceId]);

  React.useEffect(() => {
    if (videoRef.current == null) {
      return;
    }

    const stream = new MediaStream();
    if (videoTrack != null) {
      stream.addTrack(videoTrack);
    }
    if (audioTrack != null) {
      stream.addTrack(audioTrack);
    }
    videoRef.current.srcObject = stream;

    return () => {
      if (videoTrack != null) {
        stream.removeTrack(videoTrack);
      }
      if (audioTrack != null) {
        stream.removeTrack(audioTrack);
      }
    };
  }, [videoTrack, audioTrack]);

  useVolume(audioTrack, (v) => {
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

  React.useEffect(() => {
    if (videoRef.current == null) {
      return;
    }

    videoRef.current.volume = localAudioOutputEnabled ? volumeMultiplier : 0;
  }, [volumeMultiplier, localAudioOutputEnabled]);

  return (
    <S.Wrapper className={className} recentlyLoud={recentlyLoud}>
      <video ref={videoRef} autoPlay></video>
      <S.StatusIcons>
        {!audioEnabled && <S.StatusIcon name="mic_off"></S.StatusIcon>}
      </S.StatusIcons>
      <HoverMenu>
        <HoverMenuStyles.MenuItem
          name={expanded ? 'fullscreen_exit' : 'fullscreen'}
          onClick={() => {
            onSetExpanded(!expanded);
          }}
        ></HoverMenuStyles.MenuItem>
      </HoverMenu>
    </S.Wrapper>
  );
};

export default RemoteUserPanel;
