import * as S from './LocalUserPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React, { useContext } from 'react';
import { useVolume } from '../util/useVolume';
import HoverMenu from './HoverMenu';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import PanelWrapper, { PanelWrapperProps } from './PanelWrapper';
import * as Colyseus from 'colyseus.js';
import { AppInfo } from '../util/app-tracker/useAppTracker';
import AppIndicator from './AppIndicator';

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

    const { localAudioTrack, localVideoTrack } = React.useContext(
      LocalMediaContext
    );

    React.useEffect(() => {
      if (videoRef.current && localVideoTrack) {
        videoRef.current.srcObject = new MediaStream([localVideoTrack]);
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
        >
          {localVideoTrack && <video ref={videoRef} autoPlay></video>}
          <HoverMenu hidden={mouseIsIdle}>
            <HoverMenuStyles.MenuItem
              name={small ? 'fullscreen' : 'fullscreen_exit'}
              onClick={() => {
                onSetExpanded(!!small);
              }}
            ></HoverMenuStyles.MenuItem>
          </HoverMenu>
          {sharedApp != null && <AppIndicator appInfo={sharedApp} />}
        </S.Wrapper>
      </PanelWrapper>
    );
  }
);

export default LocalUserPanel;
