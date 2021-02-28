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

  ownerIdentity: string;
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
    ownerIdentity,
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
      const videoEl = videoRef.current;
      if (videoEl == null) {
        return;
      }

      const onResize = () => {
        console.log('VIDEO SIZE', videoEl.videoWidth, videoEl.videoHeight);
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
      >
        <S.Wrapper
          className={className}
          ref={wrapperRef}
          videoOpacity={videoOpacity}
        >
          <video
            ref={videoRef}
            autoPlay
            onMouseMove={(e) => {
              if (small) {
                return;
              }

              const mouseX = e.clientX - x;
              const mouseY = e.clientY - y;

              colyseusRoom.send('setCursorPosition', {
                x: (mouseX - videoXOffset) / videoProjectedWidth,
                y: (mouseY - videoYOffset) / videoProjectedHeight,
                screenOwnerIdentity: ownerIdentity,
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
                screenOwnerIdentity: ownerIdentity,
              });
            }}
            onMouseLeave={() => {
              colyseusRoom.send('removeCursor');
            }}
          ></video>
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
              colyseusRoom={colyseusRoom}
              screenOwnerIdentity={ownerIdentity}
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
