import * as S from './RemoteUserPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React, { useContext } from 'react';
import { useVolume } from '../util/useVolume';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import HoverMenu from './HoverMenu';
import NetworkQualityIndicator from './NetworkQualityIndicator';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import { MAX_INTERACTION_DISTANCE } from './constants';

export interface RemoteUserPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  audioEnabled: boolean;
  distance: number;
  reconnecting?: boolean;
  networkQuality?: number;
  small?: boolean;
  onSetExpanded(value: boolean): void;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  videoTrack,
  audioTrack,
  audioEnabled,
  distance,
  reconnecting,
  networkQuality,
  small,
  onSetExpanded,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [recentlyLoud, setRecentlyLoud] = React.useState(false);
  const recentlyLoudTimerRef = React.useRef<number | null>(null);

  const { localAudioOutputDeviceId, localAudioOutputEnabled } = useContext(
    LocalMediaContext
  );

  const scale = Math.min(1, MAX_INTERACTION_DISTANCE / 2 / (distance + 0.1));
  const volumeMultiplier = scale ** 2;
  const videoOpacity = small
    ? 1
    : Math.min(
        1,
        (2 * (MAX_INTERACTION_DISTANCE - distance)) / MAX_INTERACTION_DISTANCE
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
      audioEl.pause();
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

  const mouseIsIdle = useMouseIsIdle({ containerRef: wrapperRef });

  return (
    <S.Wrapper
      className={className}
      ref={wrapperRef}
      recentlyLoud={recentlyLoud}
      videoOpacity={videoOpacity}
    >
      <video ref={videoRef} autoPlay></video>
      <audio ref={audioRef} autoPlay></audio>
      {reconnecting && (
        <S.ReconnectingIndicator>Reconnecting...</S.ReconnectingIndicator>
      )}
      {networkQuality != null && (
        <S.StyledNetworkQualityIndicator networkQuality={networkQuality} />
      )}
      <S.StatusIcons>
        {!audioEnabled && <S.StatusIcon name="mic_off"></S.StatusIcon>}
      </S.StatusIcons>
      <HoverMenu hidden={mouseIsIdle}>
        <HoverMenuStyles.MenuItem
          name={small ? 'fullscreen' : 'fullscreen_exit'}
          onClick={() => {
            onSetExpanded(!!small);
          }}
        ></HoverMenuStyles.MenuItem>
      </HoverMenu>
    </S.Wrapper>
  );
};

export default RemoteUserPanel;
