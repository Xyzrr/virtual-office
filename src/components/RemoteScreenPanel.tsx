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
    colyseusRoom,
    videoTrack,
    distance,
    small,
    onSetExpanded,
  }) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

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
              const settings = videoTrack?.getSettings();
              if (
                settings == null ||
                settings.width == null ||
                settings.height == null
              ) {
                return;
              }

              const screenAspectRatio = settings.width / settings.height;
              const panelBounds = e.currentTarget.getBoundingClientRect();
              const panelAspectRatio = panelBounds.width / panelBounds.height;
              const mouseX = e.clientX - panelBounds.x;
              const mouseY = e.clientY - panelBounds.y;

              console.log('stream size', settings.width, settings.height);
              console.log('panel size', panelBounds.width, panelBounds.height);

              let xp: number;
              let yp: number;

              if (screenAspectRatio < panelAspectRatio) {
                yp = mouseY / panelBounds.height;
                const screenProjectedWidth =
                  panelBounds.height * screenAspectRatio;
                const xOffset = (panelBounds.width - screenProjectedWidth) / 2;
                xp = (mouseX - xOffset) / screenProjectedWidth;
              } else {
                xp = mouseX / panelBounds.width;
                const screenProjectedHeight =
                  panelBounds.width / screenAspectRatio;
                const yOffset =
                  (panelBounds.height - screenProjectedHeight) / 2;
                yp = (mouseY - yOffset) / screenProjectedHeight;
              }

              console.log('xpyp', xp, yp);
              colyseusRoom.send('setCursorPosition', {
                x: xp,
                y: yp,
                screenOwnerIdentity: ownerIdentity,
              });
            }}
            onMouseLeave={() => {
              colyseusRoom.send('removeCursor');
            }}
          ></video>
          <HoverMenu hidden={mouseIsIdle}>
            <HoverMenuStyles.MenuItem
              name={small ? 'fullscreen' : 'fullscreen_exit'}
              onClick={() => {
                onSetExpanded(!!small);
              }}
            ></HoverMenuStyles.MenuItem>
          </HoverMenu>
        </S.Wrapper>
      </PanelWrapper>
    );
  }
);

export default RemoteScreenPanel;
