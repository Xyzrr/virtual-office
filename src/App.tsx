import * as S from './App.styles';

import { v4 as uuid } from 'uuid';
import React from 'react';
import {
  connect,
  Room,
  createLocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  createLocalAudioTrack,
  LocalTrack,
  CreateLocalTrackOptions,
  LocalVideoTrack,
  LocalAudioTrack,
} from 'twilio-video';
import DailyIframe, {
  DailyCallOptions,
  DailyCall,
  DailyEvent,
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
  const [twilioRoom, setTwilioRoom] = React.useState<Room | null>(null);
  const [appState, setAppState] = useState(STATE_IDLE);

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
  const [callObject, setCallObject] = React.useState<DailyCall | null>(null);

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

  const createLocalVideoTrackOptions: CreateLocalTrackOptions = {
    name: `camera-${uuid()}`,
    width: process.env.LOW_POWER ? 16 : 1920,
    height: process.env.LOW_POWER ? 9 : 1080,
    deviceId: localVideoInputDeviceId,
  };

  const localIdentity = React.useMemo(() => {
    const result = `cool-person-${uuid()}`;
    console.log('IDENTITY', result);
    return result;
  }, []);

  React.useEffect(() => {
    const endpoint = `http${process.env.LOCAL ? '' : 's'}://${host}/token`;
    const newCallObject = DailyIframe.createCallObject();
    setCallObject(newCallObject);
    newCallObject.join({ url: 'harbor.daily.co/dev' });
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

    function handleNewMeetingState(event?: any) {
      if (callObject == null) {
        return;
      }

      switch (callObject.meetingState()) {
        case 'joined-meeting':
          setAppState('STATE_JOINED');
          break;
        case 'left-meeting':
          callObject.destroy().then(() => {
            setCallObject(null);
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
    const { sid, distance, audioEnabled } = ap;

    if (sid == null || distance == null || audioEnabled == null) {
      return;
    }

    const participant = twilioRoom?.participants.get(sid);

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

      let videoTrack: MediaStreamTrack | undefined;
      let audioTrack: MediaStreamTrack | undefined;

      participant.tracks.forEach((publication) => {
        if (publication.isSubscribed) {
          const { track } = publication;
          if (track != null && track.kind === 'video') {
            if (track.name.startsWith('camera')) {
              videoTrack = track.mediaStreamTrack;
            }
          }
          if (track != null && track.kind === 'audio') {
            audioTrack = track.mediaStreamTrack;
          }
        }
      });

      panelElements.push(
        <RemoteUserPanel
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          minY={small && mapIsSmall ? 135 + 16 : undefined}
          videoTrack={videoTrack}
          audioTrack={audioTrack}
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

              participant.videoTracks.forEach((publication) => {
                if (publication.trackName.startsWith('camera')) {
                  publication.track?.setPriority('high');
                }
              });

              setExpandedPanels([key]);
            } else {
              participant.videoTracks.forEach((publication) => {
                if (publication.trackName.startsWith('camera')) {
                  publication.track?.setPriority('low');
                }
              });

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

      let videoTrack: MediaStreamTrack | undefined;

      participant.videoTracks.forEach((publication) => {
        if (
          publication.isSubscribed &&
          publication.trackName.startsWith('screen')
        ) {
          videoTrack = publication.track?.mediaStreamTrack;
        }
      });

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
            videoTrack={videoTrack}
            distance={distance}
            small={small}
            onSetExpanded={(value) => {
              if (value) {
                if (minimized) {
                  setMinimized(false);
                }

                participant.videoTracks.forEach((publication) => {
                  if (publication.trackName.startsWith('screen')) {
                    publication.track?.setPriority('high');
                  }
                });

                setExpandedPanels([key]);
              } else {
                participant.videoTracks.forEach((publication) => {
                  if (publication.trackName.startsWith('screen')) {
                    publication.track?.setPriority('low');
                  }
                });

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
    twilioRoom?.localParticipant.videoTracks.forEach((publication) => {
      if (publication.trackName.startsWith('screen')) {
        publication.track.stop();
        publication.unpublish();
      }
    });
    setLocalScreenShareEnabled(false);

    if (!wasMinimizedWhenStartedScreenSharing.current) {
      setMinimized(false);
    }
  }, [twilioRoom]);

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
            createLocalVideoTrack(createLocalVideoTrackOptions)
              .then((track) => {
                setLocalVideoTrack(track.mediaStreamTrack);
                return twilioRoom?.localParticipant.publishTrack(track, {
                  priority: 'low',
                });
              })
              .then((publication) => {
                console.log('Successfully enabled your video:', publication);
                setLocalVideoInputEnabled(true);
                return publication;
              })
              .catch((error) => {
                console.log('Failed to create local video track', error);
              });
          },
          disableLocalVideoInput() {
            twilioRoom?.localParticipant.videoTracks.forEach((publication) => {
              if (publication.trackName.startsWith('camera')) {
                publication.track.stop();
                publication.unpublish();
              }
            });
            setLocalVideoTrack(undefined);
            setLocalVideoInputEnabled(false);
          },
          enableLocalAudioInput() {
            twilioRoom?.localParticipant.audioTracks.forEach((publication) => {
              console.log('enabling!');
              publication.track.enable();
            });
            setLocalAudioInputEnabled(true);
            colyseusRoom?.send('setPlayerAudioEnabled', true);
          },
          disableLocalAudioInput() {
            twilioRoom?.localParticipant.audioTracks.forEach((publication) => {
              publication.track.disable();
            });
            setLocalAudioInputEnabled(false);
            colyseusRoom?.send('setPlayerAudioEnabled', false);
          },
          setLocalAudioOutputEnabled,
          async setLocalAudioInputDeviceId(value: string) {
            setLocalAudioInputDeviceId(value);

            let track: LocalAudioTrack;
            try {
              track = await createLocalAudioTrack({ deviceId: value });
            } catch (error) {
              console.log('Failed to create local audio track', error);
              return;
            }

            if (!localAudioInputEnabled) {
              track.disable();
            }

            setLocalAudioTrack(track.mediaStreamTrack);
            twilioRoom?.localParticipant.audioTracks.forEach((publication) => {
              publication.track.stop();
              publication.unpublish();
            });

            try {
              await twilioRoom?.localParticipant.publishTrack(track);
            } catch (error) {
              console.log('Failed to publish local audio track', error);
              return;
            }

            console.log('Published new audio track from device ID', value);
            return track;
          },
          setLocalAudioOutputDeviceId,
          async setLocalVideoInputDeviceId(value: string) {
            setLocalVideoInputDeviceId(value);

            if (!localVideoInputEnabled) {
              return;
            }

            let track: LocalVideoTrack;
            try {
              track = await createLocalVideoTrack({
                ...createLocalVideoTrackOptions,
                deviceId: value,
              });
            } catch (error) {
              console.log('Failed to create local video track', error);
              return;
            }

            setLocalVideoTrack(track.mediaStreamTrack);
            twilioRoom?.localParticipant.videoTracks.forEach((publication) => {
              if (publication.trackName.startsWith('camera')) {
                publication.track.stop();
                publication.unpublish();
              }
            });

            try {
              await twilioRoom?.localParticipant.publishTrack(track, {
                priority: 'low',
              });
            } catch (error) {
              console.log('Failed to publish local video track', error);
              return;
            }

            console.log('Published new video track from device ID', value);
            return track;
          },
          async screenShare(id: string) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: id,
                    maxFrameRate: 10,
                    maxWidth: 1280,
                  },
                },
              } as any);

              const screenTrack = new LocalVideoTrack(stream.getTracks()[0], {
                logLevel: 'debug',
                name: `screen-${uuid()}`,
              });
              await twilioRoom?.localParticipant.publishTrack(screenTrack);

              setLocalScreenShareSourceId(id);
              setLocalScreenShareEnabled(true);
              wasMinimizedWhenStartedScreenSharing.current = minimized;
              setMinimized(true);
            } catch (e) {
              console.log('Could not capture screen', e);
            }
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
