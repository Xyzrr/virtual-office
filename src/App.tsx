import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { connect, Room, createLocalVideoTrack } from 'twilio-video';
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

const local = true;

let host: string;
if (local) {
  host = 'localhost:5000';
} else {
  host = 'virtual-office-server.herokuapp.com';
}

interface MapPanelData {
  type: 'map';
}

interface LocalUserPanelData {
  type: 'local-user';
}

interface RemoteUserPanelData {
  type: 'remote-user';
  participantSID: string;
}

export type PanelData = MapPanelData | LocalUserPanelData | RemoteUserPanelData;

const Hello = () => {
  const twilioRoomRef = React.useRef<Room | null>(null);
  const [panels, setPanels] = React.useState<{ [key: string]: PanelData }>({
    map: { type: 'map' },
    'local-user': { type: 'local-user' },
  });
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
        audio: true,
        video: { width: 240, height: 135 },
      }).then(
        (room) => {
          console.log('Joined Twilio room', room);
          twilioRoomRef.current = room;

          room.participants.forEach((participant) => {
            console.log(`Existing remote Twilio participant: ${participant}`);
            const panelId = `remote-user-${participant.identity}`;
            setPanels((panels) =>
              produce(panels, (draft) => {
                draft[panelId] = {
                  type: 'remote-user',
                  participantSID: participant.sid,
                };
              })
            );
          });

          room.on('participantConnected', (participant) => {
            console.log(`Remote Twilio participant connected: ${participant}`);
            const panelId = `remote-user-${participant.identity}`;
            setPanels((panels) =>
              produce(panels, (draft) => {
                draft[panelId] = {
                  type: 'remote-user',
                  participantSID: participant.sid,
                };
              })
            );
          });

          room.on('participantDisconnected', (participant) => {
            console.log(
              `Remote Twilio participant disconnected: ${participant}`
            );
            const panelId = `remote-user-${participant.identity}`;
            setPanels((panels) =>
              produce(panels, (draft) => {
                delete draft[panelId];
              })
            );
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

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  const heldCommands = React.useRef<{ [key: string]: boolean }>({});

  const getDir = React.useCallback(() => {
    if (heldCommands.current.right && heldCommands.current.up) {
      return Math.PI / 4;
    }
    if (heldCommands.current.right && heldCommands.current.down) {
      return -Math.PI / 4;
    }
    if (heldCommands.current.left && heldCommands.current.up) {
      return (3 * Math.PI) / 4;
    }
    if (heldCommands.current.left && heldCommands.current.down) {
      return (-3 * Math.PI) / 4;
    }
    if (heldCommands.current.right) {
      return 0;
    }
    if (heldCommands.current.up) {
      return Math.PI / 2;
    }
    if (heldCommands.current.left) {
      return Math.PI;
    }
    if (heldCommands.current.down) {
      return (3 * Math.PI) / 2;
    }
    return 0;
  }, []);

  const keyMap: { [key: string]: string } = {
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowLeft: 'left',
    ArrowDown: 'down',
    d: 'right',
    w: 'up',
    a: 'left',
    s: 'down',
  };

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      const command = keyMap[e.key];

      if (command == null) {
        return;
      }

      heldCommands.current[command] = true;

      if (
        command === 'right' ||
        command === 'up' ||
        command === 'left' ||
        command === 'down'
      ) {
        colyseusRoom?.send('setMovement', {
          dir: getDir(),
          speed: 200,
        });
      }
    },
    [colyseusRoom]
  );

  const onKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      const command = keyMap[e.key];

      if (command == null) {
        return;
      }

      delete heldCommands.current[command];

      if (
        command === 'right' ||
        command === 'up' ||
        command === 'left' ||
        command === 'down'
      ) {
        colyseusRoom?.send('setMovement', {
          dir: getDir(),
          speed:
            heldCommands.current.right ||
            heldCommands.current.up ||
            heldCommands.current.left ||
            heldCommands.current.down
              ? 100
              : 0,
        });
      }
    },
    [colyseusRoom]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyUp, onKeyDown]);

  const minimizedHeight = React.useMemo(() => {
    return (
      Object.keys(panels).filter((k) => k !== 'local-user').length * (135 + 8) +
      8
    );
  }, [panels]);

  const minimized = useFakeMinimize(minimizedHeight);

  const smallPanelOrder = minimized
    ? Object.keys(panels).filter((k) => k !== 'local-user')
    : Object.keys(panels).filter((k) => !expandedPanels.includes(k));

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

  return (
    <S.AppWrapper>
      <S.GlobalStyles minimized={minimized} focused={appFocused} />
      <S.DraggableBar />
      {Object.entries(panels).map(([key, panel]) => {
        if (minimized && key === 'local-user') {
          return null;
        }

        let x: number;
        let y: number;
        let width: number;
        let height: number;

        const small = minimized || !(key in expandedPanels);

        if (small) {
          const orderPosition = smallPanelOrder.indexOf(key);
          x = windowSize.width - 240 - 16;
          y = 8 + orderPosition * (135 + 8);

          console.log('op', orderPosition, y, panel);
          width = 240;
          height = 135;
        } else {
          x = 0;
          y = 0;
          width = windowSize.width;
          height = windowSize.height;
        }

        if (panel.type === 'map') {
          if (colyseusRoom == null) {
            return null;
          }

          return (
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
        }

        if (panel.type === 'local-user') {
          const participant = twilioRoomRef.current?.localParticipant;

          if (participant == null) {
            return null;
          }

          return (
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

        if (panel.type === 'remote-user') {
          const participant = twilioRoomRef.current?.participants.get(
            panel.participantSID
          );

          if (participant == null) {
            return null;
          }

          return (
            <S.PanelWrapper
              key={key}
              x={x}
              y={y}
              width={width}
              height={height}
              small={small}
            >
              <RemoteUserPanel participant={participant} />
            </S.PanelWrapper>
          );
        }
        return null;
      })}
    </S.AppWrapper>
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
