import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import {
  connect,
  Room,
  createLocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  Participant,
} from 'twilio-video';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import * as S from './App.styles';
import { useFakeMinimize } from './util/useFakeMinimize';
import produce from 'immer';
import RemoteUserPanel from './components/RemoteUserPanel';
import MapPanel from './components/MapPanel';
import * as electron from 'electron';
import LocalUserPanel from './components/LocalUserPanel';
import Icon from './components/Icon';
import { min } from 'lodash';
import { LocalMediaContext } from './contexts/LocalMediaContext';

const local = true;

let host: string;
if (local) {
  host = 'localhost:5000';
} else {
  host = 'virtual-office-server.herokuapp.com';
}

export interface ActiveParticipant {
  sid: string;
  distance: number;
  audioSubscribed: boolean;
  videoSubscribed: boolean;
}

const Hello = () => {
  const twilioRoomRef = React.useRef<Room | null>(null);

  const [localAudioEnabled, setLocalAudioEnabled] = React.useState(false);
  const [localVideoEnabled, setLocalVideoEnabled] = React.useState(true);

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
    fetch(`${endpoint}?${params}`, { headers }).then(async (res) => {
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

      connect(token, {
        name: 'cool-room',
        audio: localAudioEnabled,
        video: localVideoEnabled ? { width: 240, height: 135 } : undefined,
      }).then(
        (room) => {
          console.log('Joined Twilio room', room);
          twilioRoomRef.current = room;

          const handleConnectedParticipant = (
            participant: RemoteParticipant
          ) => {
            setActiveParticipants((aps) =>
              produce(aps, (draft) => {
                draft[participant.identity] = {
                  sid: participant.sid,
                  distance: 0,
                  audioSubscribed: false,
                  videoSubscribed: false,
                };
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
            console.log(
              `Remote Twilio participant disconnected: ${participant}`
            );
            handleDisconnectedParticipant(participant);
          });
        },
        (error) => {
          console.log(`Unable to connect to room: ${error.message}`);
        }
      );
    });

    return () => {
      twilioRoomRef.current?.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const client = new Colyseus.Client(`ws://${host}`);

    client.joinOrCreate('main').then((room: Colyseus.Room<any>) => {
      console.log('Joined or created Colyseus room:', room);
      room.send('setIdentity', identity);
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

  const minimized = useFakeMinimize(500);

  if (colyseusRoom == null) {
    return <S.AppWrapper>Loading Colyseus</S.AppWrapper>;
  }

  let nextSmallPanelY = 8;
  const panelElements: React.ReactNode[] = [];

  let x: number;
  let y: number;
  let width: number;
  let height: number;

  let key = 'map';
  let small = minimized || !(key in expandedPanels);

  if (small) {
    width = 240;
    x = windowSize.width - width - 8;
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
    <S.PanelWrapper
      key={key}
      x={x}
      y={y}
      width={width}
      height={height}
      small={small}
    >
      <MapPanel
        twilioRoom={twilioRoomRef.current}
        colyseusRoom={colyseusRoom}
        minimized={minimized}
      />
    </S.PanelWrapper>
  );

  if (!minimized) {
    const participant = twilioRoomRef.current?.localParticipant;

    if (participant != null) {
      key = 'local-user';
      small = !(key in expandedPanels);

      if (small) {
        width = 240;
        x = windowSize.width - width - 8;
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
        <S.PanelWrapper
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          small={small}
        >
          <LocalUserPanel participant={participant} />
        </S.PanelWrapper>
      );
    }
  }

  Object.entries(activeParticipants).forEach(([identity, ap]) => {
    const participant = twilioRoomRef.current?.participants.get(ap.sid);

    if (participant == null) {
      return;
    }

    key = 'remote-user-' + identity;
    small = minimized || !(key in expandedPanels);

    if (small) {
      width = 240;
      x = windowSize.width - width - 8;
      height = 135;
      y = nextSmallPanelY;
      nextSmallPanelY += height + 8;
    } else {
      x = 0;
      y = 0;
      width = windowSize.width;
      height = windowSize.height;
    }

    let videoElement: HTMLVideoElement | undefined;
    let audioElement: HTMLAudioElement | undefined;

    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        const { track } = publication;
        if (track != null && track.kind === 'video') {
          videoElement = track.attach();
        }
        if (track != null && track.kind === 'audio') {
          audioElement = track.attach();
        }
      }
    });
    console.log('video', videoElement, 'audio', audioElement);

    panelElements.push(
      <S.PanelWrapper
        key={key}
        x={x}
        y={y}
        width={width}
        height={height}
        small={small}
      >
        <RemoteUserPanel
          videoElement={videoElement}
          audioElement={audioElement}
        />
      </S.PanelWrapper>
    );
  });

  return (
    <LocalMediaContext.Provider
      value={{
        localVideoEnabled,
        localAudioEnabled,
        enableLocalVideo() {
          const twilioRoom = twilioRoomRef.current;
          createLocalVideoTrack({
            width: 240,
            height: 135,
          })
            .then((localVideoTrack) => {
              return twilioRoom?.localParticipant.publishTrack(localVideoTrack);
            })
            .then((publication) => {
              console.log('Successfully unmuted your video:', publication);
            });
          setLocalVideoEnabled(true);
        },
        disableLocalVideo() {
          const twilioRoom = twilioRoomRef.current;
          twilioRoom?.localParticipant.videoTracks.forEach((publication) => {
            publication.track.stop();
            publication.unpublish();
          });
          setLocalVideoEnabled(false);
        },
        enableLocalAudio() {
          const twilioRoom = twilioRoomRef.current;
          twilioRoom?.localParticipant.audioTracks.forEach((publication) => {
            publication.track.enable();
          });
          setLocalAudioEnabled(true);
        },
        disableLocalAudio() {
          const twilioRoom = twilioRoomRef.current;
          twilioRoom?.localParticipant.audioTracks.forEach((publication) => {
            publication.track.disable();
          });
          setLocalAudioEnabled(false);
        },
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
