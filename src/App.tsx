import * as S from './App.styles';

import { v4 as uuid } from 'uuid';
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
  CreateLocalTrackOptions,
  LocalVideoTrack,
  LocalAudioTrack,
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
import RemoteScreenPanel from './components/RemoteScreenPanel';
import ScreenShareToolbar from './components/ScreenShareToolbar';
import MainToolbar from './components/MainToolbar';
import { MAX_INTERACTION_DISTANCE } from './components/constants';

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
  screenSubscribed?: boolean;
  audioEnabled?: boolean;
  reconnecting?: boolean;
  networkQuality?: number;
}

const App: React.FC = () => {
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
  const [localScreenShareEnabled, setLocalScreenShareEnabled] = React.useState(
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
  const [localVideoTrack, setLocalVideoTrack] = React.useState<
    MediaStreamTrack | undefined
  >();
  const [localScreenVideoTrack, setLocalScreenVideoTrack] = React.useState<
    MediaStreamTrack | undefined
  >();

  const wasMinimizedWhenStartedScreenSharing = React.useRef(false);

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

  const createLocalVideoTrackOptions: CreateLocalTrackOptions = {
    name: `camera-${uuid()}`,
    width: process.env.LOW_POWER ? 16 : 1920,
    height: process.env.LOW_POWER ? 9 : 1080,
    deviceId: localVideoInputDeviceId,
  };

  const identity = React.useMemo(() => {
    const result = `cool-person-${uuid()}`;
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

        const localTracks: LocalTrack[] = [];

        if (!process.env.NO_AUDIO) {
          const localAudioTwilioTrack = await createLocalAudioTrack();
          setLocalAudioTrack(localAudioTwilioTrack.mediaStreamTrack);
          localTracks.push(localAudioTwilioTrack);

          if (!localAudioInputEnabled) {
            localAudioTwilioTrack.disable();
          }
        }

        if (localVideoInputEnabled) {
          const localVideoTwilioTrack = await createLocalVideoTrack(
            createLocalVideoTrackOptions
          );
          setLocalVideoTrack(localVideoTwilioTrack.mediaStreamTrack);
          localTracks.push(localVideoTwilioTrack);
        }

        /** Connect to Twilio */

        let room: Room;
        try {
          room = await connect(token, {
            name: 'cool-room',
            tracks: localTracks,
            preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
            networkQuality: { local: 1, remote: 1 },
            bandwidthProfile: {
              video: {
                mode: 'collaboration',
                renderDimensions: {
                  high: { height: 1080, width: 1920 },
                  standard: { height: 720, width: 1280 },
                  low: { height: 135, width: 240 },
                },
              },
            },
          });
        } catch (error) {
          console.log(`Unable to connect to Twilio room: ${error.message}`);
          return;
        }

        room.localParticipant.videoTracks.forEach((publication) => {
          publication.setPriority('low');
        });

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
              if (track.name.startsWith('camera')) {
                setActiveParticipants((aps) =>
                  produce(aps, (draft) => {
                    draft[participant.identity].videoSubscribed = true;
                  })
                );
              }
              if (track.name.startsWith('screen')) {
                setActiveParticipants((aps) =>
                  produce(aps, (draft) => {
                    draft[participant.identity].screenSubscribed = true;
                  })
                );
              }
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
              if (track.name.startsWith('camera')) {
                setActiveParticipants((aps) =>
                  produce(aps, (draft) => {
                    draft[participant.identity].videoSubscribed = false;
                  })
                );
              }
              if (track.name.startsWith('screen')) {
                setActiveParticipants((aps) =>
                  produce(aps, (draft) => {
                    draft[participant.identity].screenSubscribed = false;
                  })
                );
              }
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

          participant.on('reconnecting', () => {
            setActiveParticipants((aps) =>
              produce(aps, (draft) => {
                draft[participant.identity].reconnecting = true;
              })
            );
          });

          participant.on('reconnected', () => {
            setActiveParticipants((aps) =>
              produce(aps, (draft) => {
                draft[participant.identity].reconnecting = false;
              })
            );
          });

          participant.on('networkQualityLevelChanged', (level) => {
            console.log('network changed to level', level);
            setActiveParticipants((aps) =>
              produce(aps, (draft) => {
                draft[participant.identity].networkQuality = level;
              })
            );
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

        room.on('reconnecting', (error) => {
          console.log('Reconnecting:', error);
        });

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

  const [minimized, setMinimized] = useFakeMinimize();

  let nextSmallPanelY = 8;
  const panelElements: React.ReactNode[] = [];

  (() => {
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
            onSetExpanded={(value) => {
              if (minimized) {
                setMinimized(false);
              }

              if (value) {
                setExpandedPanels([key]);
              }
            }}
          />
        </S.PanelWrapper>
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
          xDirection="left"
        >
          <LocalUserPanel
            small={small}
            onSetExpanded={(value) => {
              if (minimized) {
                setMinimized(false);
              }

              if (value) {
                setExpandedPanels([key]);
              } else {
                setExpandedPanels(['map']);
              }
            }}
          />
        </S.PanelWrapper>
      );
    }
  })();

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
      let key = `remote-user-${identity}`;
      let small = minimized || !expandedPanels.includes(key);

      const scale = Math.min(
        1,
        MAX_INTERACTION_DISTANCE / 2 / (distance + 0.1)
      );

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
            distance={distance}
            reconnecting={ap.reconnecting}
            networkQuality={ap.networkQuality}
            small={small}
            onSetExpanded={(value) => {
              if (minimized) {
                setMinimized(false);
              }

              if (value) {
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
        </S.PanelWrapper>
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
      let key = `remote-screen-${identity}`;
      let small = minimized || !expandedPanels.includes(key);

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

      participant.videoTracks.forEach((publication) => {
        if (
          publication.isSubscribed &&
          publication.trackName.startsWith('screen')
        ) {
          videoTrack = publication.track?.mediaStreamTrack;
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
          <RemoteScreenPanel
            videoTrack={videoTrack}
            expanded={expandedPanels.includes(key)}
            onSetExpanded={(value) => {
              console.log('setting expanded', value, key);

              if (value) {
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
        </S.PanelWrapper>
      );
    })();
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
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720,
                },
              },
            } as any);

            const screenTrack = new LocalVideoTrack(stream.getTracks()[0], {
              logLevel: 'debug',
              name: `screen-${uuid()}`,
            });
            await twilioRoom?.localParticipant.publishTrack(screenTrack);

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
      <S.AppWrapper>
        <S.GlobalStyles minimized={minimized} focused={appFocused} />
        <S.DraggableBar />
        {panelElements}
        <MainToolbar minimized={minimized} />
      </S.AppWrapper>
      <ScreenShareToolbar
        open={localScreenShareEnabled}
        onStop={stopScreenShare}
      ></ScreenShareToolbar>
    </LocalMediaContext.Provider>
  );
};

export default App;
