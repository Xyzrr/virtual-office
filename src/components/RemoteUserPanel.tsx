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
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [recentlyLoud, setRecentlyLoud] = React.useState(false);
  const recentlyLoudTimerRef = React.useRef<number | null>(null);

  const { localAudioOutputDeviceId, localAudioOutputEnabled } = useContext(
    LocalMediaContext
  );

  React.useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl == null || videoTrack == null) {
      return;
    }

    const stream = new MediaStream();
    stream.addTrack(videoTrack);
    videoEl.srcObject = stream;

    return () => {
      stream.removeTrack(videoTrack);
      videoEl.srcObject = null;
    };
  }, [videoTrack]);

  React.useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl == null || audioTrack == null) {
      return;
    }

    const stream = new MediaStream();
    stream.addTrack(audioTrack);
    audioEl.srcObject = stream;

    return () => {
      stream.removeTrack(audioTrack);
      audioEl.srcObject = null;
    };
  }, [audioTrack]);

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
    const audioEl = audioRef.current;
    if (audioEl == null) {
      return;
    }

    (audioEl as any)
      .setSinkId(localAudioOutputDeviceId)
      .then(() => {
        console.log('Set sink ID to', localAudioOutputDeviceId);
      })
      .catch((e: any) => {
        console.log('Failed to set sink ID:', e);
      });
  }, [localAudioOutputDeviceId]);

  React.useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl == null) {
      return;
    }

    audioEl.volume = localAudioOutputEnabled ? volumeMultiplier : 0;
  }, [volumeMultiplier, localAudioOutputEnabled]);

  return (
    <S.Wrapper className={className} recentlyLoud={recentlyLoud}>
      <video ref={videoRef} autoPlay></video>
      <audio ref={audioRef} autoPlay></audio>
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
