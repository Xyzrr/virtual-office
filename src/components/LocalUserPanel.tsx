import * as S from './LocalUserPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import { useVolume } from '../util/useVolume';
import HoverMenu from './HoverMenu';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import { AppInfo } from '../util/app-tracker/useAppTracker';
import AppIndicator from './AppIndicator';
import { LocalInfoContext } from '../contexts/LocalInfoContext';
import Loader from './Loader';
import Color from 'color';
import AppSharingHelper from './AppSharingHelper';

export interface LocalUserPanelProps {
  className?: string;

  x: number;
  y: number;
  width: number;
  height: number;
  minY?: number;
  sharedApp?: AppInfo;

  small?: boolean;
  onSetExpanded(value: boolean): void;
}

const LocalUserPanel: React.FC<LocalUserPanelProps> = React.memo(
  ({
    className,
    x,
    y,
    width,
    height,
    minY,
    sharedApp,
    small,
    onSetExpanded,
  }) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [recentlyLoud, setRecentlyLoud] = React.useState(false);
    const recentlyLoudTimerRef = React.useRef<number | null>(null);

    const [videoStreaming, setVideoStreaming] = React.useState(false);

    const {
      localAudioTrack,
      localVideoTrack,
      localAudioInputOn,
      localVideoInputOn,
    } = React.useContext(LocalMediaContext);

    const { localName, localColor, appSharingOn } = React.useContext(
      LocalInfoContext
    );

    React.useEffect(() => {
      if (videoRef.current && localVideoTrack) {
        videoRef.current.srcObject = new MediaStream([localVideoTrack]);
      }
    }, [localVideoTrack]);

    React.useEffect(() => {
      if (!localVideoTrack) {
        setVideoStreaming(false);
      }
    }, [localVideoTrack]);

    useVolume(localAudioTrack, (v) => {
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

    const mouseIsIdle = useMouseIsIdle({ containerRef: wrapperRef });

    return (
      <S.LocalUserPanelWrapper
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
          noVideo={!localVideoInputOn}
        >
          {localVideoInputOn && localVideoTrack && (
            <video
              ref={videoRef}
              autoPlay
              onCanPlay={() => {
                setVideoStreaming(true);
              }}
              onEmptied={() => {
                setVideoStreaming(false);
              }}
            ></video>
          )}
          {localVideoInputOn && !videoStreaming && <Loader />}
          {/* {localColor != null && (
            <S.ColorIndicator
              color={Color(localColor).toString()}
            ></S.ColorIndicator>
          )} */}
          <S.InfoBar>
            <S.InfoBarLeft>
              <S.StatusIcons>
                {!localAudioInputOn && (
                  <S.StatusIcon name="mic_off"></S.StatusIcon>
                )}
              </S.StatusIcons>
              <S.Name>{localName}</S.Name>
            </S.InfoBarLeft>
            <AppSharingHelper />
          </S.InfoBar>
          <HoverMenu hidden={mouseIsIdle}>
            <HoverMenuStyles.MenuItem
              name={small ? 'fullscreen' : 'fullscreen_exit'}
              onClick={() => {
                onSetExpanded(!!small);
              }}
            ></HoverMenuStyles.MenuItem>
          </HoverMenu>
        </S.Wrapper>
      </S.LocalUserPanelWrapper>
    );
  }
);

export default LocalUserPanel;
