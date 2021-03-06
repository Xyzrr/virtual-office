import * as S from './App.styles';

import React from 'react';
import { useFakeMinimize } from './util/useFakeMinimize';
import RemoteUserPanel from './components/RemoteUserPanel';
import MapPanel from './components/MapPanel';
import * as electron from 'electron';
import LocalUserPanel from './components/LocalUserPanel';
import { LocalMediaContext } from './contexts/LocalMediaContext';
import RemoteScreenPanel from './components/RemoteScreenPanel';
import ScreenShareToolbar from './components/ScreenShareToolbar';
import ScreenShareOverlay from './components/ScreenShareOverlay';
import MainToolbar from './components/MainToolbar';
import { MAX_INTERACTION_DISTANCE } from './components/constants';
import { useWindowsDrag } from './util/windowsDrag';
import { useAppTracker, AppInfo } from './util/app-tracker/useAppTracker';
import { useImmer } from 'use-immer';
import NetworkPanel, { useNetworkPanel } from './components/NetworkPanel';
import { ColyseusContext, ColyseusEvent } from './contexts/ColyseusContext';
import { VideoCallContext } from './contexts/VideoCallContext/VideoCallContext';
import WelcomePanel from './WelcomePanel';
import { LocalInfoContext } from './contexts/LocalInfoContext';
import FakeMacOSFrame from './components/FakeMacOSFrame';
import { useHistory } from 'react-router-dom';
import Chatbox from './components/chat/ChatBox';
import SpaceTopBar from './components/SpaceTopBar';

export interface NearbyPlayer {
  sid?: string;
  name: string;
  distance: number;
  audioInputOn?: boolean;
  videoInputOn?: boolean;
  screenShareOn?: boolean;
  sharedApp?: AppInfo;
  whisperingTo?: string;
}

const App: React.FC = () => {
  const history = useHistory();
  React.useEffect(() => {
    electron.ipcRenderer.send('setWindowSize', { width: 1152, height: 648 });
  }, []);

  const wasMinimizedWhenStartedScreenSharing = React.useRef(false);

  const [nearbyPlayers, setNearbyPlayers] = useImmer<{
    [identity: string]: NearbyPlayer;
  }>({});
  const [expandedPanels, setExpandedPanels] = React.useState<string[]>(['map']);
  const [smallPanelsScrollY, setSmallPanelsScrollY] = React.useState(0);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const {
    localAudioInputOn,
    localVideoInputOn,
    localScreenShareOn,
  } = React.useContext(LocalMediaContext);

  const {
    localIdentity,
    setLocalGhost,
    localWhisperingTo,
    gotReady,
    setGotReady,
  } = React.useContext(LocalInfoContext);

  const { participants } = React.useContext(VideoCallContext);

  const showNetworkPanel = useNetworkPanel();

  const {
    room: colyseusRoom,
    error: colyseusError,
    addListener: addColyseusListener,
    removeListener: removeColyseusListener,
  } = React.useContext(ColyseusContext);

  React.useEffect(() => {
    if (!colyseusRoom) {
      return;
    }

    const events: ColyseusEvent[] = [
      'player-added',
      'player-updated',
      'player-removed',
    ];

    const onPlayersUpdated = () => {
      setNearbyPlayers((draft) => {
        const localPlayer = colyseusRoom.state.players.get(localIdentity);

        const distToPlayer = (player: any) => {
          return Math.sqrt(
            (player.x - localPlayer.x) ** 2 + (player.y - localPlayer.y) ** 2
          );
        };

        for (const [identity, player] of colyseusRoom.state.players.entries()) {
          if (identity !== localIdentity) {
            const dist = distToPlayer(player);

            if (dist > MAX_INTERACTION_DISTANCE) {
              continue;
            }

            if (draft[identity] == null) {
              draft[identity] = {
                name: player.name,
                distance: dist,
              };
            }

            draft[identity].name = player.name;
            draft[identity].distance = dist;
            draft[identity].audioInputOn = player.audioInputOn;
            draft[identity].videoInputOn = player.videoInputOn;
            draft[identity].screenShareOn = player.screenShareOn;
            draft[identity].sharedApp = player.sharedApp;
            draft[identity].whisperingTo = player.whisperingTo;
          }
        }

        for (const [id, np] of Object.entries(draft)) {
          const p = colyseusRoom.state.players.get(id);
          if (p == null || distToPlayer(p) > MAX_INTERACTION_DISTANCE) {
            delete draft[id];
          }
        }
      });
    };

    onPlayersUpdated();

    for (const event of events) {
      addColyseusListener(event, onPlayersUpdated);
    }

    return () => {
      for (const event of events) {
        removeColyseusListener(event, onPlayersUpdated);
      }
    };
  }, [
    colyseusRoom,
    addColyseusListener,
    removeColyseusListener,
    localIdentity,
  ]);

  const [appFocused, setAppFocused] = React.useState(true);
  React.useEffect(() => {
    const onFocus = () => {
      setAppFocused(true);
    };

    const onBlur = () => {
      setAppFocused(false);
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  });

  const onResize = React.useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedPanels(['map']);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  const dragWindowsProps = useWindowsDrag();

  const [minimized, setMinimized] = useFakeMinimize();

  const contentYOffset = minimized ? 0 : 40;
  const availableHeight = windowSize.height - contentYOffset;

  let nextSmallPanelY = 8 + contentYOffset;
  const panelElements: React.ReactNode[] = [];

  let mapIsSmall: boolean;

  (() => {
    let x: number;
    let y: number;
    let width: number;
    let height: number;
    let key = 'map';
    let small = minimized || !expandedPanels.includes(key);
    mapIsSmall = small;

    if (small) {
      width = 240;
      x = 8;
      height = 135;
      y = nextSmallPanelY;
      nextSmallPanelY += height + 8;
    } else {
      x = 0;
      y = 0;
      width = windowSize.width;
      height = windowSize.height;
    }

    panelElements.push(
      <MapPanel
        key={key}
        x={x}
        y={y}
        width={width}
        height={height}
        localPlayerIdentity={localIdentity}
        small={small}
        onSetExpanded={(value) => {
          if (value) {
            if (minimized) {
              setMinimized(false);
            }

            setExpandedPanels([key]);
          }
        }}
      />
    );
  })();

  (() => {
    if (!minimized) {
      let x: number;
      let y: number;
      let width: number;
      let height: number;
      let key = 'local-user';
      let small = !expandedPanels.includes(key);

      if (small) {
        width = 240;
        x = 8;
        height = localVideoInputOn ? 135 : 40;
        y = nextSmallPanelY - smallPanelsScrollY;
        nextSmallPanelY += height + 8;
      } else {
        x = 0;
        y = contentYOffset;
        width = windowSize.width;
        height = availableHeight;
      }

      panelElements.push(
        <LocalUserPanel
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          minY={small && mapIsSmall ? 135 + 16 : undefined}
          small={small}
          onSetExpanded={(value) => {
            if (value) {
              if (minimized) {
                setMinimized(false);
              }

              setExpandedPanels([key]);
            } else {
              setExpandedPanels(['map']);
            }
          }}
        />
      );
    }
  })();

  React.useEffect(() => {
    for (const panel of expandedPanels) {
      const [type, identity] = panel.split(':');

      if (type === 'remote-user') {
        if (nearbyPlayers[identity] == null) {
          setExpandedPanels(['map']);
        }
      }

      if (type === 'remote-screen') {
        if (
          nearbyPlayers[identity] == null ||
          !participants[identity].screenVideoTrack
        ) {
          setExpandedPanels(['map']);
        }
      }
    }
  }, [nearbyPlayers, participants]);

  console.debug('Nearby players:', nearbyPlayers);

  Object.entries(nearbyPlayers).forEach(([identity, np]) => {
    if (identity == localIdentity) {
      return;
    }

    const { distance, audioInputOn, videoInputOn, screenShareOn } = np;

    const participant = participants[identity];

    if (!participant) {
      return;
    }

    (() => {
      let x: number;
      let y: number;
      let width: number;
      let height: number;
      let key = `remote-user:${identity}`;
      let small = minimized || !expandedPanels.includes(key);

      const scale = Math.min(
        1,
        MAX_INTERACTION_DISTANCE / 2 / (distance + 0.1)
      );

      if (small) {
        width = Math.floor(240 * scale);
        x = 8;
        height = videoInputOn ? Math.floor(135 * scale) : 40;
        y = nextSmallPanelY - smallPanelsScrollY;
        nextSmallPanelY += height + 8;
      } else {
        x = 0;
        y = contentYOffset;
        width = windowSize.width;
        height = availableHeight;
      }

      panelElements.push(
        <RemoteUserPanel
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          minY={small && mapIsSmall ? 135 + 16 : undefined}
          identity={identity}
          name={np.name}
          videoTrack={participant.videoTrack}
          audioTrack={participant.audioTrack}
          audioInputOn={audioInputOn}
          videoInputOn={videoInputOn}
          distance={distance}
          sharedApp={np.sharedApp}
          whisperingTo={np.whisperingTo}
          whisperTarget={localWhisperingTo === identity}
          small={small}
          onSetExpanded={(value) => {
            if (value) {
              if (minimized) {
                setMinimized(false);
              }

              setExpandedPanels([key]);
            } else {
              setExpandedPanels(['map']);
            }
          }}
        />
      );
    })();

    if (!screenShareOn) {
      return;
    }

    (() => {
      let x: number;
      let y: number;
      let width: number;
      let height: number;
      let key = `remote-screen:${identity}`;
      let small = minimized || !expandedPanels.includes(key);

      const scale = Math.min(
        1,
        MAX_INTERACTION_DISTANCE / 2 / (distance + 0.1)
      );

      if (small) {
        width = Math.floor(240 * scale);
        x = 8;
        height = Math.floor(135 * scale);
        y = nextSmallPanelY - smallPanelsScrollY;
        nextSmallPanelY += height + 8;
      } else {
        x = 0;
        y = contentYOffset;
        width = windowSize.width;
        height = availableHeight;
      }

      if (colyseusRoom != null) {
        panelElements.push(
          <RemoteScreenPanel
            key={key}
            x={x}
            y={y}
            width={width}
            height={height}
            minY={small && mapIsSmall ? 135 + 16 : undefined}
            screenOwnerIdentity={identity}
            colyseusRoom={colyseusRoom}
            videoTrack={participant.screenVideoTrack}
            distance={distance}
            small={small}
            onSetExpanded={(value) => {
              if (value) {
                if (minimized) {
                  setMinimized(false);
                }

                setExpandedPanels([key]);
              } else {
                setExpandedPanels(['map']);
              }
            }}
          />
        );
      }
    })();
  });

  React.useEffect(() => {
    if (!minimized) {
      return;
    }

    electron.ipcRenderer.invoke(
      'updateMinimizedHeight',
      Math.min(window.screen.availHeight - window.screenY, nextSmallPanelY)
    );
  }, [nextSmallPanelY, minimized]);

  React.useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (
        e.x > window.innerWidth - 256 &&
        e.x < window.innerWidth &&
        e.y > contentYOffset
      ) {
        setSmallPanelsScrollY((y) =>
          Math.max(0, Math.min(nextSmallPanelY - availableHeight, y + e.deltaY))
        );
      }
    };

    window.addEventListener('wheel', onWheel);
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [nextSmallPanelY, contentYOffset, availableHeight]);

  React.useEffect(() => {
    if (localScreenShareOn) {
      wasMinimizedWhenStartedScreenSharing.current = minimized;
      setMinimized(true);
    } else {
      if (!wasMinimizedWhenStartedScreenSharing.current) {
        setMinimized(false);
      }
    }
  }, [localScreenShareOn]);

  const screenShareTrulyOn =
    participants[localIdentity] &&
    !!participants[localIdentity].screenVideoTrack;

  const welcomePanelOnJoin = React.useCallback(() => {
    setGotReady(true);
    setLocalGhost(false);
  }, []);

  return (
    <>
      <S.AppWrapper
        {...(minimized && dragWindowsProps)}
        welcomePanelOpen={!gotReady}
        minimized={minimized}
        focused={appFocused}
      >
        {!minimized && <FakeMacOSFrame />}
        {!minimized && (
          <SpaceTopBar
            focused={appFocused}
            hide={!gotReady}
            activeTab={minimized ? 'floating' : 'focused'}
            onSelectTab={(tab) => {
              if (tab === 'floating') {
                setMinimized(true);
              }
              if (tab === 'focused') {
                setMinimized(false);
              }
            }}
          ></SpaceTopBar>
        )}
        {colyseusError && <S.ColyseusError>{colyseusError}</S.ColyseusError>}
        <S.AppContents>
          {panelElements}
          <MainToolbar minimized={minimized} hide={!gotReady} />
          {showNetworkPanel && <NetworkPanel />}
          {!minimized && <Chatbox></Chatbox>}
        </S.AppContents>
        <WelcomePanel
          open={!gotReady}
          onJoin={welcomePanelOnJoin}
        ></WelcomePanel>
      </S.AppWrapper>
      {screenShareTrulyOn && (
        <>
          <ScreenShareToolbar></ScreenShareToolbar>
          <ScreenShareOverlay />
        </>
      )}
    </>
  );
};

export default App;
