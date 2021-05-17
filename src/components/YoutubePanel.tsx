import * as S from './YoutubePanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as Colyseus from 'colyseus.js';
import { useImmer } from 'use-immer';
import ReactPlayer from 'react-player'

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

export interface Syn {
  valid: boolean;
  n?: number;
}

export interface SynchronizedVideoState {
  isPlaying: boolean;
  videoPosition: number;
  currentVideo: string;
}

export interface LocalVideoState {
  loaded: number;
  loadedSeconds: number;
  played: number;
  playedSeconds: number;
  isSeeking: boolean;
  duration: number;
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

    const ref = React.useRef();
    const [syn, setSyn] = React.useState<Syn>({valid: false});
    const [videoState, setVideoState] = React.useState<SynchronizedVideoState>(undefined);
    const [localState, setLocalState] = React.useState<LocalVideoState>({
      loaded: 0,
      loadedSeconds: 0,
      played: 0,
      playedSeconds: 0,
      isSeeking: false,
      duration: -1,
    });

    const [playlist, setPlaylist] = useImmer<{
      [index: string]: string
    }>({});

    const videoOpacity = small
      ? 1
      : Math.min(
          1,
          (2 * (MAX_INTERACTION_DISTANCE - distance)) / MAX_INTERACTION_DISTANCE
        );

    const positionIsSynced = (localPosition) =>
      Math.abs(youtubePlayer.videoPosition - localPosition) <= MAX_YOUTUBE_POSITION_DISTANCE_S;

    const sendColyseusUpdate = (event, data) => {
      if (syn.valid) {
        colyseusRoom?.send(event, {
          ...data,
          id: youtubePlayer.id,
          syn: syn.n,
          localIdentity,
        });
        setSyn({
          valid: true,
          n: syn.n + 1,
        });
      }
    };

    const syncClientPlayer = React.useCallback((youtubePlayer, videoState) => {
      if (!ref || !ref.current) {
        return;
      }

      if (!positionIsSynced(localState.playedSeconds)) {
        ref.current.seekTo(videoState.videoPosition, 'seconds');
      }

      setSyn({
        valid: true,
        n: youtubePlayer.syn,
      });
    }, [ref, localState]);

    React.useEffect(() => {
      if (!youtubePlayer || !ref) {
        return;
      }
      syncClientPlayer(youtubePlayer, videoState);
    }, [videoState, ref]);

    React.useEffect(() => {
      youtubePlayer.onChange = (changes: any) => {
        setSyn({
          ...syn,
          valid: false,
        });
        setVideoState({
          isPlaying: youtubePlayer.isPlaying,
          videoPosition: youtubePlayer.videoPosition,
          currentVideo: youtubePlayer.currentVideo,
        });
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
          {videoState && 
            <ReactPlayer
              ref={ref}
              url={`https://www.youtube.com/watch?v=${videoState.currentVideo}`}
              playing={videoState.isPlaying}
              width={'100%'}
              height={'100%'}
              config={{
                youtube: {
                  playerVars: {
                    fs: '0',
                  },
                }
              }}
              controls
              onReady={() => syncClientPlayer(youtubePlayer, videoState)}
              onDuration={duration => {
                setLocalState({
                  ...localState,
                  duration,
                })
              }}
              onPause={() => {
                if (videoState.isPlaying) {
                  sendColyseusUpdate('updateVideoIsPlaying', { isPlaying: false });
                }
              }}
              onPlay={() => {
                if (!videoState.isPlaying) {
                  sendColyseusUpdate('updateVideoIsPlaying', { isPlaying: true });
                }
              }}
              onProgress={e => {
                if (!localState.isSeeking) {
                  setLocalState({
                    ...localState,
                    ...e,
                  });
                  sendColyseusUpdate('updateVideoPosition', { videoPosition: e.playedSeconds });
                }
              }}
              onEnded={() => sendColyseusUpdate('endVideo', {})}
              onBuffer={console.log}
            />
          }
          {videoState &&
            <input
              style={{
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
              type='range' min={0} max={0.999999} step='any'
              value={localState.played}
              onMouseDown={e => {
                setLocalState({
                  ...localState,
                  played: parseFloat(e.target.value),
                  isSeeking: true,
                });
                ref.current.seekTo(parseFloat(e.target.value), 'fraction');
              }}
              onChange={e => {
                setLocalState({
                  ...localState,
                  played: parseFloat(e.target.value),
                });
                ref.current.seekTo(parseFloat(e.target.value), 'fraction');
              }}
              onMouseUp={e => {
                const frac = parseFloat(e.target.value);
                setLocalState({
                  ...localState,
                  played: frac,
                  isSeeking: false,
                });
                if (localState.duration !== -1) {
                  sendColyseusUpdate('updateVideoPosition', { videoPosition: localState.duration * frac });
                }
                ref.current.seekTo(parseFloat(e.target.value), 'fraction');
              }}
            />
          }
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
