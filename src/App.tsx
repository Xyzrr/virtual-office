import * as S from './App.styles';

import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import {
  connect,
  Room,
  createLocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  Participant,
  RemoteVideoTrack,
  RemoteAudioTrack,
  createLocalTracks,
  createLocalAudioTrack,
  LocalTrack,
} from 'twilio-video';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import { useFakeMinimize } from './util/useFakeMinimize';
import produce from 'immer';
import RemoteUserPanel from './components/RemoteUserPanel';
import MapPanel from './components/MapPanel';
import * as electron from 'electron';
import LocalUserPanel from './components/LocalUserPanel';
import Icon from './components/Icon';
import { min } from 'lodash';
import { LocalMediaContext } from './contexts/LocalMediaContext';

const local = false;

let host: string;
if (local) {
  host = 'localhost:5000';
} else {
  host = 'virtual-office-server.herokuapp.com';
}

export interface ActiveParticipant {
  sid?: string;
  distance?: number;
  audioSubscribed?: boolean;
  videoSubscribed?: boolean;
  audioEnabled?: boolean;
}

const Hello = () => {
  const [twilioRoom, setTwilioRoom] = React.useState<Room | null>(null);

  const [localAudioInputEnabled, setLocalAudioInputEnabled] = React.useState(
    true
  );
  const [localVideoInputEnabled, setLocalVideoInputEnabled] = React.useState(
    true
  );
  const [localAudioOutputEnabled, setLocalAudioOutputEnabled] = React.useState(
    false
  );
  const [localAudioInputDeviceId, setLocalAudioInputDeviceId] = React.useState(
    'default'
  );
  const [
    localAudioOutputDeviceId,
    setLocalAudioOutputDeviceId,
  ] = React.useState('default');
  const [localVideoInputDeviceId, setLocalVideoInputDeviceId] = React.useState(
    'default'
  );

  const [localAudioTrack, setLocalAudioTrack] = React.useState<
    MediaStreamTrack | undefined
  >();

  const [activeParticipants, setActiveParticipants] = React.useState<{
    [identity: string]: ActiveParticipant;
  }>({});
  const [expandedPanels, setExpandedPanels] = React.useState<string[]>(['map']);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [colyseusRoom, setColyseusRoom] = React.useState<Colyseus.Room | null>(
    null
  );

  const identity = React.useMemo(() => {
    const result = `cool-person-${Math.floor(Math.random() * 10000)}`;
    console.log('IDENTITY', result);
    return result;
  }, []);

  React.useEffect(() => {
    const endpoint = `http${local ? '' : 's'}://${host}/token`;
    const params = new window.URLSearchParams({
      identity,
      roomName: 'cool-room',
    });
    const headers = new window.Headers();
    fetch(`${endpoint}?${params}`, { headers })
      .then(async (res) => {
        let token: string | undefined;
        try {
          token = await res.text();
        } catch (e) {
          console.log(e);
        }

        if (token == null) {
          return;
        }

        console.log('Twilio access token:', token);

        /** Initialize local tracks */

        // const localAudioTwilioTrack = await createLocalAudioTrack();
        // setLocalAudioTrack(localAudioTwilioTrack.mediaStreamTrack);
        const localTracks: LocalTrack[] = [];

        if (localVideoInputEnabled) {
          localTracks.push(
            await createLocalVideoTrack({
              width: 240,
              height: 135,
            })
          );
        }

        console.log('local', localTracks);

        if (!localAudioInputEnabled) {
          // localAudioTwilioTrack.disable();
        }

        /** Connect to Twilio */

        let room: Room;
        try {
          room = await connect(token, {
            name: 'cool-room',
            tracks: localTracks,
          });
        } catch (error) {
          console.log(`Unable to connect to Twilio room: ${error.message}`);
          return;
        }

        window.addEventListener('beforeunload', () => {
          room.disconnect();
        });

        console.log('Joined Twilio room', room);
        setTwilioRoom(room);

        const handleConnectedParticipant = (participant: RemoteParticipant) => {
          setActiveParticipants((aps) =>
            produce(aps, (draft) => {
              if (draft[participant.identity] == null) {
                draft[participant.identity] = {};
              }
              draft[participant.identity].sid = participant.sid;
            })
          );

          const handleSubscribedTrack = (track: RemoteTrack) => {
            if (track.kind === 'video') {
              setActiveParticipants((aps) =>
                produce(aps, (draft) => {
                  draft[participant.identity].videoSubscribed = true;
                })
              );
            }
            if (track.kind === 'audio') {
              setActiveParticipants((aps) =>
                produce(aps, (draft) => {
                  draft[participant.identity].audioSubscribed = true;
                })
              );
            }
          };

          const handleUnsubscribedTrack = (track: RemoteTrack) => {
            if (track.kind === 'video') {
              setActiveParticipants((aps) =>
                produce(aps, (draft) => {
                  draft[participant.identity].videoSubscribed = false;
                })
              );
            }
            if (track.kind === 'audio') {
              setActiveParticipants((aps) =>
                produce(aps, (draft) => {
                  draft[participant.identity].audioSubscribed = false;
                })
              );
            }
          };

          participant.tracks.forEach((publication) => {
            if (publication.isSubscribed && publication.track != null) {
              console.log('Existing subscribed remote track.');
              handleSubscribedTrack(publication.track);
            }
          });

          participant.on('trackSubscribed', (track: RemoteTrack) => {
            console.log('Remote track subscribed.');
            handleSubscribedTrack(track);
          });

          participant.on('trackUnsubscribed', (track: RemoteTrack) => {
            console.log('Remote track unsubscribed.');
            handleUnsubscribedTrack(track);
          });
        };

        const handleDisconnectedParticipant = (
          participant: RemoteParticipant
        ) => {
          setActiveParticipants((aps) =>
            produce(aps, (draft) => {
              delete draft[participant.identity];
            })
          );
        };

        room.participants.forEach((participant) => {
          console.log(`Existing remote Twilio participant: ${participant}`);
          handleConnectedParticipant(participant);
        });

        room.on('participantConnected', (participant) => {
          console.log(`Remote Twilio participant connected: ${participant}`);
          handleConnectedParticipant(participant);
        });

        room.on('participantDisconnected', (participant) => {
          console.log(`Remote Twilio participant disconnected: ${participant}`);
          handleDisconnectedParticipant(participant);
        });
      })
      .catch((error) => {
        console.log('Failed to connect to', endpoint, error);
      });
  }, []);

  React.useEffect(() => {
    if (twilioRoom == null) {
      return;
    }

    return () => {
      console.log('Disconnecting from Twilio room:', twilioRoom);
      twilioRoom.disconnect();
    };
  }, [twilioRoom]);

  React.useEffect(() => {
    const client = new Colyseus.Client(`ws://${host}`);

    client
      .joinOrCreate('main', { identity, audioEnabled: localAudioInputEnabled })
      .then((room: Colyseus.Room<any>) => {
        console.log('Joined or created Colyseus room:', room);
        setColyseusRoom(room);
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

  const onResize = React.useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

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

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  const minimized = useFakeMinimize();

  let nextSmallPanelY = 8;
  const panelElements: React.ReactNode[] = [];

  let x: number;
  let y: number;
  let width: number;
  let height: number;

  let key = 'map';
  let small = minimized || !expandedPanels.includes(key);

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
      <S.PanelWrapper
        key={key}
        x={x}
        y={y}
        width={width}
        height={height}
        small={small}
        xDirection="left"
      >
        <MapPanel
          localPlayerIdentity={identity}
          onPlayerAudioEnabledChanged={(identity, audioEnabled) => {
            console.log('heard audio change');
            setActiveParticipants((aps) => {
              return produce(aps, (draft) => {
                if (draft[identity] == null) {
                  draft[identity] = {};
                }
                draft[identity].audioEnabled = audioEnabled;
              });
            });
          }}
          onPlayerDistanceChanged={(identity, distance) => {
            setActiveParticipants((aps) => {
              return produce(aps, (draft) => {
                if (draft[identity] == null) {
                  draft[identity] = {};
                }
                draft[identity].distance = distance;
              });
            });
          }}
          colyseusRoom={colyseusRoom}
          small={small}
        />
      </S.PanelWrapper>
    );
  }

  if (!minimized && localVideoInputEnabled) {
    const participant = twilioRoom?.localParticipant;

    if (participant != null) {
      key = 'local-user';
      small = !expandedPanels.includes(key);

      if (small) {
        width = 240;
        x = 8;
        height = 135;
        y = nextSmallPanelY;
        nextSmallPanelY += height + 8;
        console.log('small');
      } else {
        console.log('not small');
        x = 0;
        y = 0;
        width = windowSize.width;
        height = windowSize.height;
      }

      let videoTrack: MediaStreamTrack | undefined;
      let audioTrack: MediaStreamTrack | undefined;

      participant.videoTracks.forEach((publication) => {
        const { track } = publication;
        videoTrack = track.mediaStreamTrack;
      });

      participant.audioTracks.forEach((publication) => {
        const { track } = publication;
        audioTrack = track.mediaStreamTrack;
      });

      panelElements.push(
        <S.PanelWrapper
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          small={small}
          xDirection="left"
        >
          <LocalUserPanel
            videoTrack={videoTrack}
            audioTrack={audioTrack}
            expanded={expandedPanels.includes('local-user')}
            onSetExpanded={(value) => {
              if (value) {
                setExpandedPanels(['local-user']);
              } else {
                setExpandedPanels(['map']);
              }
            }}
          />
        </S.PanelWrapper>
      );
    }
  }

  Object.entries(activeParticipants).forEach(([identity, ap]) => {
    const { sid, distance, audioEnabled } = ap;

    if (sid == null || distance == null || audioEnabled == null) {
      return;
    }

    const participant = twilioRoom?.participants.get(sid);

    if (participant == null) {
      return;
    }

    if (distance > 6) {
      return;
    }

    key = `remote-user-${identity}`;
    small = minimized || !expandedPanels.includes(key);

    const scale = Math.min(1, 3 / (distance + 0.1));

    if (small) {
      width = 240 * scale;
      x = 8;
      height = 135 * scale;
      y = nextSmallPanelY;
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
          videoTrack = track.mediaStreamTrack;
        }
        if (track != null && track.kind === 'audio') {
          audioTrack = track.mediaStreamTrack;
        }
      }
    });

    panelElements.push(
      <S.PanelWrapper
        key={key}
        x={x}
        y={y}
        width={width}
        height={height}
        small={small}
        xDirection="left"
      >
        <RemoteUserPanel
          videoTrack={videoTrack}
          audioTrack={audioTrack}
          audioEnabled={audioEnabled}
          volumeMultiplier={scale}
        />
      </S.PanelWrapper>
    );
  });

  React.useEffect(() => {
    if (!minimized) {
      return;
    }

    electron.ipcRenderer.invoke(
      'updateMinimizedHeight',
      Math.floor(nextSmallPanelY)
    );
  }, [nextSmallPanelY, minimized]);

  return (
    <LocalMediaContext.Provider
      value={{
        localVideoInputEnabled,
        localAudioInputEnabled,
        localAudioOutputEnabled,
        localAudioTrack,
        localAudioInputDeviceId,
        localAudioOutputDeviceId,
        localVideoInputDeviceId,
        enableLocalVideoInput() {
          createLocalVideoTrack({
            width: 240,
            height: 135,
          })
            .then((localVideoTrack) => {
              return twilioRoom?.localParticipant.publishTrack(localVideoTrack);
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
            publication.track.stop();
            publication.unpublish();
          });
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
        setLocalAudioInputDeviceId,
        setLocalAudioOutputDeviceId,
        setLocalVideoInputDeviceId,
      }}
    >
      <S.AppWrapper>
        <S.GlobalStyles minimized={minimized} focused={appFocused} />
        <S.DraggableBar />
        {panelElements}
      </S.AppWrapper>
    </LocalMediaContext.Provider>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
