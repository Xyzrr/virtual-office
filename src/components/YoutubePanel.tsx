import * as S from './YoutubePanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as Colyseus from 'colyseus.js';
import { useImmer } from 'use-immer';

import { ColyseusYoutubePlayer } from '../App';

import HoverMenu from './HoverMenu';
import {
  MAX_INTERACTION_DISTANCE,
  MAX_YOUTUBE_POSITION_DISTANCE_S,
  YOUTUBE_POSITION_UPDATE_INTERVAL_S,
} from './constants';
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

    const sendColyseusUpdate = (clientPlayer, event, data) => {
      colyseusRoom?.send(event, {
        ...data,
        id: youtubePlayer.id,
        syn: clientPlayer.syn,
        localIdentity,
      });
      clientPlayer.syn += 1;
    };

    const syncClientPlayer = (youtubePlayer, clientPlayer) => {
      if (youtubePlayer.isPlaying && clientPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
        clientPlayer.playVideo();
      } else if (!youtubePlayer.isPlaying && clientPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        clientPlayer.pauseVideo();
      }
      if (Math.abs(clientPlayer.getCurrentTime() - youtubePlayer.videoPosition) > MAX_YOUTUBE_POSITION_DISTANCE_S) {
        clientPlayer.seekTo(youtubePlayer.videoPosition, true); // allowSeekAhead = true
      }
      clientPlayer.syn = youtubePlayer.syn;
    };

    React.useEffect(() => {
      const script = document.createElement('script');
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = () => {
        setClientPlayer(new YT.Player(youtubePlayer.id, {
          height: '100%',
          width: '100%',
          playerVars: {
            fs: '0',
            // origin: "file://",
          },
          events: {
            'onReady': (e) => setPlayerReady(true),
            'onStateChange': (e) => {
              if (e.target.loading) {
                if (e.data === YT.PlayerState.PLAYING) {
                  syncClientPlayer(youtubePlayer, e.target);
                  e.target.loading = false;
                }
              } else if (e.data === YT.PlayerState.ENDED) {
                sendColyseusUpdate(e.target, 'endVideo', {});
              } else {
                sendColyseusUpdate(e.target, 'updateVideoPosition', {
                  videoPosition: e.target.getCurrentTime(),
                });
                if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.PAUSED) {
                  sendColyseusUpdate(e.target, 'updateVideoIsPlaying', {
                    isPlaying: e.data === YT.PlayerState.PLAYING,
                  });
                }
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
      if (!clientPlayer) {
        return;
      }
      const youtubePosUpdate = setInterval(() => {
         // getCurrentTime not a function if the video is not fully loaded
        if (clientPlayer.getCurrentTime && clientPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
          sendColyseusUpdate(clientPlayer, 'updateVideoPosition', {
            videoPosition: clientPlayer.getCurrentTime(),
          });
        }
      }, YOUTUBE_POSITION_UPDATE_INTERVAL_S * 1000);

      return () => clearInterval(youtubePosUpdate)
    }, [clientPlayer]);

    React.useEffect(() => {
      if (!youtubePlayer || !playerReady) {
        return;
      }

      youtubePlayer.onChange = (changes: any) => {
        const videoChange = changes.find(c => c.field === 'currentVideo');
        if (videoChange) {
          if (videoChange.value != undefined) {
            clientPlayer.loadVideoById(videoChange.value);
            clientPlayer.loading = true;
            // after load is complete, the client player will sync (UNSTARTED event)
          }
        } else {
          syncClientPlayer(youtubePlayer, clientPlayer);
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

      youtubePlayer.triggerAll();
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
