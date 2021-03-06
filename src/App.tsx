import * as S from './App.styles';

import { v4 as uuid } from 'uuid';
import React from 'react';
import { DailyEvent } from '@daily-co/daily-js';
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
import { CallObjectContext } from './contexts/CallObjectContext';

let host: string;
if (process.env.LOCAL) {
  host = 'localhost:5000';
} else {
  host = 'virtual-office-server.herokuapp.com';
}

export interface ActiveParticipant {
  sid?: string;
  distance?: number;
  audioSubscribed?: boolean;
  videoSubscribed?: boolean;
  screenSubscribed?: boolean;
  audioInputOn?: boolean;
  videoInputOn?: boolean;
  sharedApp?: AppInfo;

  dailyConnected?: boolean;
  colyseusConnected?: boolean;
}

const App: React.FC = () => {
  const wasMinimizedWhenStartedScreenSharing = React.useRef(false);

  const [activeParticipants, setActiveParticipants] = useImmer<{
    [identity: string]: ActiveParticipant;
  }>({});
  const [expandedPanels, setExpandedPanels] = React.useState<string[]>(['map']);
  const [smallPanelsScrollY, setSmallPanelsScrollY] = React.useState(0);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const localIdentity = React.useMemo(() => {
    const result = `cool-person-${uuid()}`;
    console.log('Local identity:', result);
    return result;
  }, []);

  const { callObject, join: joinDaily, leave: leaveDaily } = React.useContext(
    CallObjectContext
  );

  const { localAudioInputOn, localScreenShareOn } = React.useContext(
    LocalMediaContext
  );

  React.useEffect(() => {
    joinDaily('dev', localIdentity);

    return () => {
      leaveDaily();
    };
  }, [joinDaily]);

  React.useEffect(() => {
    window.addEventListener('beforeunload', leaveDaily);

    return () => {
      window.removeEventListener('beforeunload', leaveDaily);
    };
  }, [leaveDaily]);

  /**
   * Start listening for participant changes, when the callObject is set.
   */
  React.useEffect(() => {
    const events: DailyEvent[] = [
      'participant-joined',
      'participant-updated',
      'participant-left',
    ];

    function handleNewParticipantsState(event: DailyEvent) {
      setActiveParticipants((draft) => {
        const participants = callObject.participants();

        console.log('PARTICIPANTS', participants);

        for (const [sid, participant] of Object.entries(participants)) {
          if (draft[participant.user_name] == null) {
            draft[participant.user_name] = { dailyConnected: true };
          }

          draft[participant.user_name].sid = sid;
          draft[participant.user_name].videoSubscribed = participant.video;
          draft[participant.user_name].audioSubscribed = participant.audio;
          draft[participant.user_name].screenSubscribed = participant.screen;
        }

        for (const [id, ap] of Object.entries(draft)) {
          if (ap.sid != null && participants[ap.sid] == null) {
            draft[id].dailyConnected = false;

            if (!draft[id].colyseusConnected) {
              delete draft[id];
            }
          }
        }
      });
    }

    // Listen for changes in state
    for (const event of events) {
      callObject.on(event, handleNewParticipantsState);
    }

    // Stop listening for changes in state
    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewParticipantsState);
      }
    };
  }, [callObject]);

  const showNetworkPanel = useNetworkPanel();

  const {
    room: colyseusRoom,
    join: joinColyseus,
    leave: leaveColyseus,
    addListener: addColyseusListener,
    removeListener: removeColyseusListener,
  } = React.useContext(ColyseusContext);

  React.useEffect(() => {
    joinColyseus('main', localIdentity);
  }, [joinColyseus]);

  React.useEffect(() => {
    return () => {
      leaveColyseus();
    };
  }, [leaveColyseus]);

  React.useEffect(() => {
    if (!colyseusRoom) {
      return;
    }

    const events: ColyseusEvent[] = [
      'participant-added',
      'participant-updated',
      'participant-removed',
    ];

    const onParticipantsUpdated = () => {
      setActiveParticipants((draft) => {
        const localPlayer = colyseusRoom.state.players.get(localIdentity);

        const updateDistanceToPlayer = (id: string, player: any) => {
          const dist = Math.sqrt(
            (player.x - localPlayer.x) ** 2 + (player.y - localPlayer.y) ** 2
          );

          draft[id].distance = dist;
        };

        for (const [identity, player] of colyseusRoom.state.players.entries()) {
          if (identity !== localIdentity) {
            if (draft[identity] == null) {
              draft[identity] = { colyseusConnected: true };
            }

            updateDistanceToPlayer(identity, player);
            draft[identity].audioInputOn = player.audioInputOn;
            draft[identity].videoInputOn = player.videoInputOn;
            draft[identity].sharedApp = player.sharedApp;
          }
        }

        for (const [id, ap] of Object.entries(draft)) {
          if (colyseusRoom.state.players.get(id) == null) {
            draft[id].colyseusConnected = false;

            if (!draft[id].dailyConnected) {
              delete draft[id];
            }
          }
        }
      });
    };

    onParticipantsUpdated();

    for (const event of events) {
      addColyseusListener(event, onParticipantsUpdated);
    }

    return () => {
      for (const event of events) {
        removeColyseusListener(event, onParticipantsUpdated);
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

  const localApp = useAppTracker();

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
      y = contentYOffset;
      width = windowSize.width;
      height = availableHeight;
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
        height = 135;
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
          sharedApp={localApp}
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

  console.log('activeparts', activeParticipants);

  React.useEffect(() => {
    Object.entries(activeParticipants).forEach(([identity, ap]) => {
      const { distance } = ap;
      let cameraKey = `remote-user:${identity}`;
      let screenKey = `remote-screen:${identity}`;

      if (
        distance != null &&
        distance <= MAX_INTERACTION_DISTANCE &&
        ap.sid != null
      ) {
        callObject?.updateParticipant(ap.sid, {
          setSubscribedTracks: true,
        });
      }

      if (
        distance != null &&
        distance > MAX_INTERACTION_DISTANCE &&
        ap.sid != null
      ) {
        callObject?.updateParticipant(ap.sid, {
          setSubscribedTracks: false,
        });
      }

      if (
        distance != null &&
        distance > MAX_INTERACTION_DISTANCE &&
        (expandedPanels.includes(cameraKey) ||
          expandedPanels.includes(screenKey))
      ) {
        setExpandedPanels(['map']);
      }
    });

    for (const panel of expandedPanels) {
      const [type, identity] = panel.split(':');

      if (type === 'remote-user') {
        if (activeParticipants[identity] == null) {
          setExpandedPanels(['map']);
        }
      }

      if (type === 'remote-screen') {
        if (
          activeParticipants[identity] == null ||
          !activeParticipants[identity].screenSubscribed
        ) {
          setExpandedPanels(['map']);
        }
      }
    }
  }, [activeParticipants]);

  Object.entries(activeParticipants).forEach(([identity, ap]) => {
    if (identity == localIdentity) {
      return;
    }

    const { sid, distance, audioInputOn, videoInputOn } = ap;
    console.log('should have remote 3');

    if (sid == null || distance == null) {
      return;
    }

    const participant = callObject?.participants()[sid];
    console.log('should have remote 2');

    if (participant == null) {
      return;
    }

    console.log('should have remote 1');

    if (distance > MAX_INTERACTION_DISTANCE) {
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
        height = Math.floor(135 * scale);
        y = nextSmallPanelY - smallPanelsScrollY;
        nextSmallPanelY += height + 8;
      } else {
        x = 0;
        y = contentYOffset;
        width = windowSize.width;
        height = availableHeight;
      }

      console.log('should have remote');

      panelElements.push(
        <RemoteUserPanel
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          minY={small && mapIsSmall ? 135 + 16 : undefined}
          videoTrack={participant.videoTrack}
          audioTrack={participant.audioTrack}
          audioInputOn={audioInputOn}
          videoInputOn={videoInputOn}
          distance={distance}
          sharedApp={ap.sharedApp}
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

    if (!ap.screenSubscribed) {
      return;
    }

    (() => {
      let x: number;
      let y: number;
      let width: number;
      let height: number;
      let key = `remote-screen:${identity}`;
      let small = minimized || !expandedPanels.includes(key);

      const scale = Math.min(1, 3 / (distance + 0.1));

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
            ownerIdentity={identity}
            localIdentity={localIdentity}
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

  return (
    <>
      <S.GlobalStyles minimized={minimized} focused={appFocused} />
      <S.AppWrapper {...(minimized && dragWindowsProps)}>
        {!minimized && (
          <S.TopBar focused={appFocused}>
            <S.LeftButtons>
              {/* <S.ExitButton name="logout"></S.ExitButton> */}
            </S.LeftButtons>
            <S.MiddleButtons>
              <S.Tab
                selected={minimized}
                onClick={() => {
                  setMinimized(true);
                }}
              >
                <S.TabIcon name="splitscreen"></S.TabIcon>Floating
              </S.Tab>
              <S.Tab
                selected={!minimized}
                onClick={() => {
                  setMinimized(false);
                }}
              >
                <S.TabIcon name="view_sidebar"></S.TabIcon>
                Focused
              </S.Tab>
              {/* <S.Tab>
              <S.TabIcon name="grid_view"></S.TabIcon>
              Grid
            </S.Tab> */}
            </S.MiddleButtons>
            <S.RightButtons>
              <S.Tab>
                <S.TabIcon name="link"></S.TabIcon>Copy invite link
              </S.Tab>
              {/* <S.Tab iconOnly>
              <S.TabIcon name="settings"></S.TabIcon>
            </S.Tab> */}
            </S.RightButtons>
          </S.TopBar>
        )}
        <S.AppContents>
          {panelElements}
          <MainToolbar minimized={minimized} />
          {showNetworkPanel && <NetworkPanel />}
        </S.AppContents>
      </S.AppWrapper>
      <ScreenShareToolbar></ScreenShareToolbar>
      <ScreenShareOverlay localIdentity={localIdentity} />
    </>
  );
};

export default App;
