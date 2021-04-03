import * as S from './YoutubePanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as Colyseus from 'colyseus.js';

import { ColyseusYoutubePlayer } from '../App';

import HoverMenu from './HoverMenu';
import { MAX_INTERACTION_DISTANCE } from './constants';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import PanelWrapper from './PanelWrapper';
import { LocalInfoContext } from '../contexts/LocalInfoContext';
import Loader from './Loader';

export interface YoutubeProps {
  className?: string;

  x: number;
  y: number;
  width: number;
  height: number;
  minY?: number;
  youtubePlayer: ColyseusYoutubePlayer;

  screenOwnerIdentity: string;
  colyseusRoom: Colyseus.Room;
  distance: number;
  small?: boolean;
  onSetExpanded(value: boolean): void;
}

const YoutubePanel: React.FC<YoutubeProps> = React.memo(
  ({
    className,
    x,
    y,
    width,
    height,
    minY,
    youtubePlayer,
    screenOwnerIdentity,
    distance,
    small,
    onSetExpanded,
  }) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const { localIdentity } = React.useContext(LocalInfoContext);

    const [videoSize, setVideoSize] = React.useState<{
      width: number;
      height: number;
    }>({ width: 100, height: 100 });
    const [clientPlayer, setClientPlayer] = React.useState<YT.Player>(undefined);

    const videoOpacity = small
      ? 1
      : Math.min(
          1,
          (2 * (MAX_INTERACTION_DISTANCE - distance)) / MAX_INTERACTION_DISTANCE
        );

    React.useEffect(() => {
      if (!youtubePlayer) {
        return;
      }

      const script = document.createElement('script');
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = () => {
        setClientPlayer(
          new YT.Player(youtubePlayer.id, {
            height: '100%',
            width: '100%',
            videoId: youtubePlayer.currentVideo,
            events: {
              'onReady': (e) => e.target.playVideo(),
              'onStateChange': (e) => {},
            }
          })
        );
      };

      return () => {
        window.onYouTubeIframeAPIReady = () => {};
        document.body.removeChild(script);
      }
    }, [youtubePlayer]);

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
          {youtubePlayer && <div id={youtubePlayer.id}/>}
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

export default YoutubePanel;
