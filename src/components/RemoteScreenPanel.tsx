import * as S from './RemoteScreenPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as Colyseus from 'colyseus.js';
import HoverMenu from './HoverMenu';
import { MAX_INTERACTION_DISTANCE } from './constants';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import PanelWrapper from './PanelWrapper';

export interface RemoteScreenPanelProps {
  className?: string;

  x: number;
  y: number;
  width: number;
  height: number;
  minY?: number;

  screenOwnerIdentity: string;
  localIdentity: string;
  colyseusRoom: Colyseus.Room;
  videoTrack?: MediaStreamTrack;
  distance: number;
  small?: boolean;
  onSetExpanded(value: boolean): void;
}

const RemoteScreenPanel: React.FC<RemoteScreenPanelProps> = React.memo(
  ({
    className,
    x,
    y,
    width,
    height,
    minY,
    screenOwnerIdentity,
    localIdentity,
    colyseusRoom,
    videoTrack,
    distance,
    small,
    onSetExpanded,
  }) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [videoSize, setVideoSize] = React.useState<{
      width: number;
      height: number;
    }>({ width: 100, height: 100 });

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
      const videoEl = videoRef.current;
      if (videoEl == null) {
        return;
      }

      const onResize = () => {
        setVideoSize({
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
        });
      };

      videoEl.addEventListener('resize', onResize);

      return () => {
        videoEl?.removeEventListener('resize', onResize);
      };
    }, []);

    const mouseIsIdle = useMouseIsIdle({ containerRef: wrapperRef });

    const {
      videoProjectedWidth,
      videoProjectedHeight,
      videoXOffset,
      videoYOffset,
    } = React.useMemo(() => {
      let videoProjectedWidth: number;
      let videoProjectedHeight: number;
      let videoXOffset: number;
      let videoYOffset: number;

      const videoAspectRatio = videoSize.width / videoSize.height;
      const panelAspectRatio = width / height;

      if (videoAspectRatio < panelAspectRatio) {
        videoProjectedWidth = height * videoAspectRatio;
        videoProjectedHeight = height;
        videoXOffset = (width - videoProjectedWidth) / 2;
        videoYOffset = 0;
      } else {
        videoProjectedWidth = width;
        videoProjectedHeight = width / videoAspectRatio;
        videoXOffset = 0;
        videoYOffset = (height - videoProjectedHeight) / 2;
      }

      return {
        videoProjectedWidth,
        videoProjectedHeight,
        videoXOffset,
        videoYOffset,
      };
    }, [videoSize, width, height]);

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
          videoOpacity={videoOpacity}
        >
          {videoTrack && (
            <video
              ref={videoRef}
              autoPlay
              onMouseMove={(e) => {
                if (small) {
                  return;
                }

                const mouseX = e.clientX - x;
                const mouseY = e.clientY - y;

                colyseusRoom.send('updatePlayerCursor', {
                  x: (mouseX - videoXOffset) / videoProjectedWidth,
                  y: (mouseY - videoYOffset) / videoProjectedHeight,
                  surfaceType: 'screen',
                  surfaceId: screenOwnerIdentity,
                });
              }}
              onMouseDown={(e) => {
                if (small) {
                  return;
                }

                const mouseX = e.clientX - x;
                const mouseY = e.clientY - y;

                colyseusRoom.send('cursorMouseDown', {
                  x: (mouseX - videoXOffset) / videoProjectedWidth,
                  y: (mouseY - videoYOffset) / videoProjectedHeight,
                  surfaceType: 'screen',
                  surfaceId: screenOwnerIdentity,
                });
              }}
              onMouseLeave={() => {
                colyseusRoom.send('updatePlayerCursor', { cursor: undefined });
              }}
            ></video>
          )}
          {small && (
            <HoverMenu hidden={mouseIsIdle}>
              <HoverMenuStyles.MenuItem
                name={small ? 'fullscreen' : 'fullscreen_exit'}
                onClick={() => {
                  onSetExpanded(!!small);
                }}
              ></HoverMenuStyles.MenuItem>
            </HoverMenu>
          )}
          {!small && (
            <S.ShiftedCursorsOverlay
              screenOwnerIdentity={screenOwnerIdentity}
              localIdentity={localIdentity}
              x={videoXOffset}
              y={videoYOffset}
              width={videoProjectedWidth}
              height={videoProjectedHeight}
            ></S.ShiftedCursorsOverlay>
          )}
        </S.Wrapper>
      </PanelWrapper>
    );
  }
);

export default RemoteScreenPanel;
