import * as S from './YoutubePanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as Colyseus from 'colyseus.js';
import { useImmer } from 'use-immer';

import { ColyseusYoutubePlayer } from '../App';

import HoverMenu from './HoverMenu';
import { MAX_INTERACTION_DISTANCE } from './constants';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import PanelWrapper from './PanelWrapper';
import Loader from './Loader';

import { ColyseusContext } from '../contexts/ColyseusContext';
import { LocalInfoContext } from '../contexts/LocalInfoContext';

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
    const { room: colyseusRoom } = React.useContext(ColyseusContext);

    const [videoSize, setVideoSize] = React.useState<{
      width: number;
      height: number;
    }>({ width: 100, height: 100 });
    const [clientPlayer, setClientPlayer] = React.useState<YT.Player>(undefined);
    const [playerReady, setPlayerReady] = React.useState<boolean>(false);

    const [playlist, setPlaylist] = useImmer<{
      [index: string]: string
    }>({});

    const videoOpacity = small
      ? 1
      : Math.min(
          1,
          (2 * (MAX_INTERACTION_DISTANCE - distance)) / MAX_INTERACTION_DISTANCE
        );

    React.useEffect(() => {
      const script = document.createElement('script');
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = () => {
        setClientPlayer(new YT.Player(youtubePlayer.id, {
          height: '100%',
          width: '100%',
          origin: "https://www.youtube.com",
          events: {
            'onReady': (e) => setPlayerReady(true),
            'onStateChange': (e) => {
              if (e.data === YT.PlayerState.ENDED) {
                colyseusRoom?.send('endVideo', { id: youtubePlayer.id, videoId: youtubePlayer.currentVideo });
              }
            },
          }
        }));
      };

      return () => {
        window.onYouTubeIframeAPIReady = () => {};
        document.body.removeChild(script);
      }
    }, []);

    React.useEffect(() => {
      if (!youtubePlayer || !playerReady) {
        return;
      }

      youtubePlayer.onChange = (changes: any) => {
        for (let c of changes) {
          if (c.field === 'currentVideo') {
            clientPlayer.loadVideoById(c.value)
          }
        }
      }

      youtubePlayer.videoQueue.onRemove = (videoId: any, i: any) => {
        setPlaylist(draft => {
          delete draft[i];
        });
      }

      youtubePlayer.videoQueue.onAdd = (videoId: string, i: any) => {
        setPlaylist(draft => {
          draft[i] = videoId;
        });
      };
      youtubePlayer.triggerAll()

    }, [youtubePlayer, clientPlayer, playerReady]);

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
