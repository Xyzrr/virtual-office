import * as S from './App.styles';

import { v4 as uuid } from 'uuid';
import React from 'react';
import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipant,
  DailyCallOptions,
} from '@daily-co/daily-js';
import * as Colyseus from 'colyseus.js';
import { useFakeMinimize } from './util/useFakeMinimize';
import produce from 'immer';
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
import CallObjectContext from './contexts/CallObjectContext';

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
  audioEnabled?: boolean;
  reconnecting?: boolean;
  networkQuality?: number;
  sharedApp?: AppInfo;
}

const App: React.FC = () => {
  const [appState, setAppState] = React.useState<string>('STATE_IDLE');

  const [localAudioInputEnabled, setLocalAudioInputEnabled] = React.useState(
    true
  );
  const [localVideoInputEnabled, setLocalVideoInputEnabled] = React.useState(
    true
  );
  const [localAudioOutputEnabled, setLocalAudioOutputEnabled] = React.useState(
    true
  );
  const [localScreenShareEnabled, setLocalScreenShareEnabled] = React.useState(
    false
  );
  const [
    localScreenShareSourceId,
    setLocalScreenShareSourceId,
  ] = React.useState<string | undefined>();
  const [localAudioInputDeviceId, setLocalAudioInputDeviceId] = React.useState<
    string | undefined
  >();
  const [
    localAudioOutputDeviceId,
    setLocalAudioOutputDeviceId,
  ] = React.useState('default');
  const [localVideoInputDeviceId, setLocalVideoInputDeviceId] = React.useState<
    string | undefined
  >();

  const [localAudioTrack, setLocalAudioTrack] = React.useState<
    MediaStreamTrack | undefined
  >();
  const [localVideoTrack, setLocalVideoTrack] = React.useState<
    MediaStreamTrack | undefined
  >();
  const [localScreenVideoTrack, setLocalScreenVideoTrack] = React.useState<
    MediaStreamTrack | undefined
  >();
  const [callObject, setCallObject] = React.useState<DailyCall | undefined>();

  const wasMinimizedWhenStartedScreenSharing = React.useRef(false);

  const [activeParticipants, setActiveParticipants] = React.useState<{
    [identity: string]: ActiveParticipant;
  }>({});
  const [expandedPanels, setExpandedPanels] = React.useState<string[]>(['map']);
  const [smallPanelsScrollY, setSmallPanelsScrollY] = React.useState(0);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [colyseusRoom, setColyseusRoom] = React.useState<Colyseus.Room | null>(
    null
  );

  console.log('rtcpeers', (window as any).rtcpeers);

  const localIdentity = React.useMemo(() => {
    const result = `cool-person-${uuid()}`;
    console.log('Local identity:', result);
    return result;
  }, []);

  React.useEffect(() => {
    (async () => {
      const newCallObject = DailyIframe.createCallObject({
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      });
      setCallObject(newCallObject);

      const options: DailyCallOptions = {
        url: 'http://harbor.daily.co/dev',
      };

      // missing userName property in type definition
      (options as any).userName = localIdentity;

      const participantObject = await newCallObject.join(options);

      if (process.env.LOW_POWER) {
        newCallObject.setBandwidth({
          trackConstraints: { width: 16, height: 9 },
        });
      }

      console.log('Joined Daily room', participantObject);
    })();
  }, []);

  /**
   * Update app state based on reported meeting state changes.
   *
   * NOTE: Here we're showing how to completely clean up a call with destroy().
   * This isn't strictly necessary between join()s, but is good practice when
   * you know you'll be done with the call object for a while and you're no
   * longer listening to its events.
   */
  React.useEffect(() => {
    if (callObject == null) {
      return;
    }

    const events: DailyEvent[] = ['joined-meeting', 'left-meeting', 'error'];

    function handleNewMeetingState(event?: DailyEvent) {
      if (callObject == null) {
        return;
      }

      switch (callObject.meetingState()) {
        case 'joined-meeting':
          setAppState('STATE_JOINED');
          break;
        case 'left-meeting':
          callObject.destroy().then(() => {
            setCallObject(undefined);
            setAppState('STATE_IDLE');
          });
          break;
        case 'error':
          setAppState('STATE_ERROR');
          break;
        default:
          break;
      }
    }

    // Use initial state
    handleNewMeetingState();

    // Listen for changes in state
    for (const event of events) {
      callObject.on(event, handleNewMeetingState);
    }

    // Stop listening for changes in state
    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewMeetingState);
      }
    };
  }, [callObject]);

  console.log('RENDER PARTICIPANTS', callObject?.participants());

  /**
   * Start listening for participant changes, when the callObject is set.
   */
  React.useEffect(() => {
    if (!callObject) return;

    const events: DailyEvent[] = [
      'participant-joined',
      'participant-updated',
      'participant-left',
    ];

    function handleNewParticipantsState(event: DailyEvent) {
      if (callObject == null) {
        return;
      }

      setActiveParticipants((aps) =>
        produce(aps, (draft) => {
          const participants = callObject.participants();

          for (const [sid, participant] of Object.entries(participants)) {
            if (draft[participant.user_name] == null) {
              draft[participant.user_name] = {};
            }

            draft[participant.user_name].sid = sid;

            draft[participant.user_name].videoSubscribed = participant.video;

            draft[participant.user_name].audioSubscribed = participant.audio;

            draft[participant.user_name].screenSubscribed = participant.screen;
          }

          for (const [id, ap] of Object.entries(draft)) {
            if (ap.sid != null && participants[ap.sid] == null) {
              delete draft[id];
            }
          }
        })
      );
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

  /**
   * Show the call UI if we're either joining, already joined, or are showing
   * an error.
   */
  const showCall = ['STATE_JOINING', 'STATE_JOINED', 'STATE_ERROR'].includes(
    appState
  );

  /**
   * Only enable the call buttons (camera toggle, leave call, etc.) if we're joined
   * or if we've errored out.
   *
   * !!!
   * IMPORTANT: calling callObject.destroy() *before* we get the "joined-meeting"
   * can result in unexpected behavior. Disabling the leave call button
   * until then avoids this scenario.
   * !!!
   */
  const enableCallButtons = ['STATE_JOINED', 'STATE_ERROR'].includes(appState);

  React.useEffect(() => {
    if (!callObject) return;

    function handleNewParticipantsState(event?: DailyEventObjectParticipant) {
      if (callObject == null) {
        return;
      }

      const localParticipant = callObject.participants().local;

      if (localParticipant == null) {
        return;
      }

      setLocalAudioInputEnabled(localParticipant.audio);
      setLocalVideoInputEnabled(localParticipant.video);
      setLocalScreenShareEnabled(localParticipant.screen);

      setLocalAudioTrack(localParticipant.audioTrack);
      setLocalVideoTrack(localParticipant.videoTrack);
      setLocalScreenVideoTrack(localParticipant.screenVideoTrack);
    }

    handleNewParticipantsState();

    // Listen for changes in state
    callObject.on('participant-updated', handleNewParticipantsState);

    // Stop listening for changes in state
    return function cleanup() {
      callObject.off('participant-updated', handleNewParticipantsState);
    };
  }, [callObject]);

  React.useEffect(() => {
    const client = new Colyseus.Client(`ws://${host}`);

    client
      .joinOrCreate('main', {
        identity: localIdentity,
        audioEnabled: localAudioInputEnabled,
      })
      .then((room: Colyseus.Room<any>) => {
        console.log('Joined or created Colyseus room:', room);
        setColyseusRoom(room);

        room.state.players.onAdd = (player: any, identity: string) => {
          console.log('Colyseus player added:', identity);

          setActiveParticipants((aps) => {
            return produce(aps, (draft) => {
              if (draft[identity] == null) {
                draft[identity] = {};
              }
              draft[identity].audioEnabled = player.audioEnabled;
            });
          });

          player.onChange = (changes: Colyseus.DataChange[]) => {
            console.log('Player changed:', changes);

            const localPlayer = room.state.players.get(localIdentity);

            const updateDistanceToPlayer = (id: string, player: any) => {
              const dist = Math.sqrt(
                (player.x - localPlayer.x) ** 2 +
                  (player.y - localPlayer.y) ** 2
              );

              setActiveParticipants((aps) => {
                return produce(aps, (draft) => {
                  if (draft[id] == null) {
                    return;
                  }

                  draft[id].distance = dist;
                });
              });
            };

            if (localPlayer != null) {
              if (identity === localIdentity) {
                for (const [id, p] of room.state.players.entries()) {
                  updateDistanceToPlayer(id, p);
                }
              } else {
                updateDistanceToPlayer(identity, player);
              }
            }

            if (
              changes.find((c) => (c as any).field === 'audioEnabled') != null
            ) {
              setActiveParticipants((aps) => {
                return produce(aps, (draft) => {
                  if (draft[identity] == null) {
                    return;
                  }

                  draft[identity].audioEnabled = player.audioEnabled;
                });
              });
            }

            if (changes.find((c) => (c as any).field === 'sharedApp') != null) {
              setActiveParticipants((aps) => {
                return produce(aps, (draft) => {
                  if (draft[identity] == null) {
                    return;
                  }

                  draft[identity].sharedApp = player.sharedApp;
                });
              });
            }
          };
        };
      });
  }, []);

  React.useEffect(() => {
    if (colyseusRoom == null) {
      return;
    }

    return () => {
      console.log('Leaving Colyseus room');
      colyseusRoom.leave();
    };
  }, [colyseusRoom]);

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

  const dragProps = useWindowsDrag();

  const localApp = useAppTracker(colyseusRoom);

  const [minimized, setMinimized] = useFakeMinimize();

  let nextSmallPanelY = 8;
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

    if (colyseusRoom != null) {
      panelElements.push(
        <MapPanel
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          localPlayerIdentity={localIdentity}
          colyseusRoom={colyseusRoom}
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
    }
  })();

  (() => {
    if (!minimized && localVideoTrack != null) {
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
        y = 0;
        width = windowSize.width;
        height = windowSize.height;
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

  React.useEffect(() => {
    Object.entries(activeParticipants).forEach(([identity, ap]) => {
      const { distance } = ap;
      let cameraKey = `remote-user:${identity}`;
      let screenKey = `remote-screen:${identity}`;

      if (distance != null && distance > MAX_INTERACTION_DISTANCE) {
        // callObject?.subs
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

    const { sid, distance, audioEnabled } = ap;

    if (sid == null || distance == null || audioEnabled == null) {
      return;
    }

    const participant = callObject?.participants()[sid];

    if (participant == null) {
      return;
    }

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
        y = 0;
        width = windowSize.width;
        height = windowSize.height;
      }

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
          audioEnabled={audioEnabled}
          distance={distance}
          reconnecting={ap.reconnecting}
          networkQuality={ap.networkQuality}
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
        y = 0;
        width = windowSize.width;
        height = windowSize.height;
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
      if (e.x > window.innerWidth - 256 && e.x < window.innerWidth) {
        setSmallPanelsScrollY((y) =>
          Math.max(
            0,
            Math.min(nextSmallPanelY - window.innerHeight, y + e.deltaY)
          )
        );
      }
    };

    window.addEventListener('wheel', onWheel);
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [nextSmallPanelY]);

  const stopScreenShare = React.useCallback(() => {
    callObject?.stopScreenShare();

    if (!wasMinimizedWhenStartedScreenSharing.current) {
      setMinimized(false);
    }
  }, [callObject]);

  return (
    <CallObjectContext.Provider value={callObject}>
      <LocalMediaContext.Provider
        value={{
          localVideoInputEnabled,
          localAudioInputEnabled,
          localAudioOutputEnabled,
          localAudioTrack,
          localVideoTrack,
          localScreenVideoTrack,
          localAudioInputDeviceId,
          localAudioOutputDeviceId,
          localVideoInputDeviceId,
          localScreenShareSourceId,
          localScreenShareEnabled,
          enableLocalVideoInput() {
            callObject?.setLocalVideo(true);
          },
          disableLocalVideoInput() {
            callObject?.setLocalVideo(false);
          },
          enableLocalAudioInput() {
            callObject?.setLocalAudio(true);
            colyseusRoom?.send('setPlayerAudioEnabled', true);
          },
          disableLocalAudioInput() {
            callObject?.setLocalAudio(false);
            colyseusRoom?.send('setPlayerAudioEnabled', false);
          },
          setLocalAudioOutputEnabled,
          async setLocalAudioInputDeviceId(value: string) {
            setLocalAudioInputDeviceId(value);
            callObject?.setInputDevices({ audioDeviceId: value });
          },
          setLocalAudioOutputDeviceId,
          async setLocalVideoInputDeviceId(value: string) {
            setLocalVideoInputDeviceId(value);

            if (!localVideoInputEnabled) {
              return;
            }

            callObject?.setInputDevices({ videoDeviceId: value });
          },
          async screenShare(id: string) {
            callObject?.startScreenShare({ chromeMediaSourceId: id });
            setLocalScreenShareSourceId(id);
          },
          stopScreenShare,
        }}
      >
        <S.AppWrapper {...(minimized && dragProps)}>
          <S.GlobalStyles minimized={minimized} focused={appFocused} />
          <S.DraggableBar {...(!minimized && dragProps)}></S.DraggableBar>
          {panelElements}
          <MainToolbar minimized={minimized} />
        </S.AppWrapper>
        <ScreenShareToolbar
          open={localScreenShareEnabled}
          onStop={stopScreenShare}
        ></ScreenShareToolbar>
        {colyseusRoom != null && localScreenShareSourceId != null && (
          <ScreenShareOverlay
            open={localScreenShareEnabled}
            colyseusRoom={colyseusRoom}
            localIdentity={localIdentity}
            sourceId={localScreenShareSourceId}
          />
        )}
      </LocalMediaContext.Provider>
    </CallObjectContext.Provider>
  );
};

export default App;
