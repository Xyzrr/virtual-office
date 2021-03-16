import * as S from './RemoteUserPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React, { useContext } from 'react';
import { useVolume } from '../util/useVolume';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import HoverMenu from './HoverMenu';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import { MAX_INTERACTION_DISTANCE } from './constants';
import PanelWrapper from './PanelWrapper';
import { AppInfo } from '../util/app-tracker/useAppTracker';
import AppIndicator from './AppIndicator';
import { CircularProgress } from '@material-ui/core';
import Loader from './Loader';
import { ColyseusContext } from '../contexts/ColyseusContext';
import { LocalInfoContext } from '../contexts/LocalInfoContext';

export interface RemoteUserPanelProps {
  className?: string;

  x: number;
  y: number;
  width: number;
  height: number;
  minY?: number;

  identity: string;
  name: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  audioInputOn?: boolean;
  videoInputOn?: boolean;
  distance: number;
  sharedApp?: AppInfo;
  whisperingTo?: string;
  whisperTarget?: boolean;

  small?: boolean;
  onSetExpanded(value: boolean): void;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = React.memo(
  ({
    className,
    x,
    y,
    width,
    height,
    minY,
    identity,
    name,
    videoTrack,
    audioTrack,
    audioInputOn,
    videoInputOn,
    distance,
    sharedApp,
    small,
    whisperingTo,
    whisperTarget,
    onSetExpanded,
  }) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [recentlyLoud, setRecentlyLoud] = React.useState(false);
    const recentlyLoudTimerRef = React.useRef<number | null>(null);
    const [videoStreaming, setVideoStreaming] = React.useState(false);

    const { localAudioOutputDeviceId, localAudioOutputOn } = useContext(
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
      if (videoRef.current && videoTrack) {
        videoRef.current.srcObject = new MediaStream([videoTrack]);
      }
    }, [videoTrack]);

    React.useEffect(() => {
      if (audioRef.current && audioTrack) {
        audioRef.current.srcObject = new MediaStream([audioTrack]);
      }
    }, [audioTrack]);

    React.useEffect(() => {
      if (!videoTrack) {
        setVideoStreaming(false);
      }
    }, [videoTrack]);

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

    const {
      localIdentity,
      localWhisperingTo,
      setLocalWhisperingTo,
    } = React.useContext(LocalInfoContext);

    React.useEffect(() => {
      const audioEl = audioRef.current;
      if (audioEl == null) {
        return;
      }

      let vol = localAudioOutputOn ? volumeMultiplier : 0;
      if (whisperingTo && whisperingTo !== localIdentity) {
        vol = 0;
      }
      audioEl.volume = vol;
    }, [volumeMultiplier, localAudioOutputOn, whisperingTo]);

    const mouseIsIdle = useMouseIsIdle({ containerRef: wrapperRef });

    return (
      <PanelWrapper
        x={x}
        y={y}
        z={small ? 2 : 0}
        width={width}
        height={height}
        xDirection="left"
        minY={minY}
        floating={small}
      >
        <S.Wrapper
          className={className}
          ref={wrapperRef}
          recentlyLoud={recentlyLoud}
          videoOpacity={videoOpacity}
          noVideo={!videoInputOn}
          whisperTarget={localWhisperingTo === identity}
          backgrounded={
            localWhisperingTo != null && localWhisperingTo !== identity
          }
        >
          {videoInputOn && videoTrack && (
            <video
              ref={videoRef}
              onCanPlay={() => {
                setVideoStreaming(true);
              }}
              onEmptied={() => {
                setVideoStreaming(false);
              }}
              autoPlay
            ></video>
          )}
          {videoInputOn && !videoStreaming && <Loader />}
          {audioInputOn && audioTrack && (
            <audio ref={audioRef} autoPlay></audio>
          )}
          <S.InfoBar>
            <S.InfoBarLeft>
              <S.StatusIcons>
                {!audioInputOn && <S.StatusIcon name="mic_off"></S.StatusIcon>}
              </S.StatusIcons>
              <S.Name>{name}</S.Name>
            </S.InfoBarLeft>
            {sharedApp != null && <AppIndicator appInfo={sharedApp} />}
          </S.InfoBar>
          <HoverMenu hidden={mouseIsIdle}>
            <HoverMenuStyles.MenuItem
              name={small ? 'fullscreen' : 'fullscreen_exit'}
              onClick={() => {
                onSetExpanded(!!small);
              }}
            />
            <HoverMenuStyles.MenuItem
              name={whisperTarget ? 'hearing_disabled' : 'hearing'}
              onClick={() => {
                if (whisperTarget) {
                  setLocalWhisperingTo(undefined);
                } else {
                  setLocalWhisperingTo(identity);
                }
              }}
            />
          </HoverMenu>
        </S.Wrapper>
      </PanelWrapper>
    );
  }
);

export default RemoteUserPanel;
