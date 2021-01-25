import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { connect, Room } from 'twilio-video';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import * as S from './App.styles';
import { useFakeMinimize } from './util/useFakeMinimize';
import produce from 'immer';
import RemoteUserPanel from './components/RemoteUserPanel';
import MapPanel from './components/MapPanel';

interface MapPanelData {
  type: 'map';
}

interface LocalUserPanelData {
  type: 'local-user';
  participantSID: string;
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
  });
  const [expandedPanels, setExpandedPanels] = React.useState<string[]>(['map']);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [colyseusRoom, setColyseusRoom] = React.useState<Colyseus.Room | null>(
    null
  );

  React.useEffect(() => {
    // const endpoint = 'http://localhost:5000/token';
    const endpoint = 'https://virtual-office-server.herokuapp.com/token';
    const params = new window.URLSearchParams({
      identity: `cool-person-${Math.floor(Math.random() * 10000)}`,
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

      console.log('token', token);

      connect(token, {
        name: 'cool-room',
        audio: false,
        video: { width: 240, height: 135 },
      }).then(
        (room) => {
          console.log('Joined room', room);
          twilioRoomRef.current = room;

          room.participants.forEach((participant) => {
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
            console.log(`Remote participant connected: ${participant}`);
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
        },
        (error) => {
          console.log(`Unable to connect to room: ${error.message}`);
        }
      );
    });
  }, []);

  console.log('PANELS', panels);

  React.useEffect(() => {
    const client = new Colyseus.Client(
      'ws://virtual-office-server.herokuapp.com'
    );
    // const client = new Colyseus.Client('ws://localhost:3434');

    client.joinOrCreate('main').then((room: Colyseus.Room<any>) => {
      setColyseusRoom(room);
    });
  }, []);

  const onResize = React.useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerWidth });
  }, []);

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  const keys = React.useRef<{ [key: string]: boolean }>({});

  const getDir = React.useCallback(() => {
    if (keys.current.ArrowRight && keys.current.ArrowUp) {
      return Math.PI / 4;
    }
    if (keys.current.ArrowRight && keys.current.ArrowDown) {
      return -Math.PI / 4;
    }
    if (keys.current.ArrowLeft && keys.current.ArrowUp) {
      return (3 * Math.PI) / 4;
    }
    if (keys.current.ArrowLeft && keys.current.ArrowDown) {
      return (-3 * Math.PI) / 4;
    }
    if (keys.current.ArrowRight) {
      return 0;
    }
    if (keys.current.ArrowUp) {
      return Math.PI / 2;
    }
    if (keys.current.ArrowLeft) {
      return Math.PI;
    }
    if (keys.current.ArrowDown) {
      return (3 * Math.PI) / 2;
    }
    return 0;
  }, []);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft'
      ) {
        colyseusRoom?.send('setMovement', {
          dir: getDir(),
          speed: 100,
        });
      }
    },
    [colyseusRoom]
  );

  const onKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      delete keys.current[e.key];
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft'
      ) {
        colyseusRoom?.send('setMovement', {
          dir: getDir(),
          speed:
            keys.current.ArrowRight ||
            keys.current.ArrowLeft ||
            keys.current.ArrowUp ||
            keys.current.ArrowDown
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

  const minimized = useFakeMinimize();

  const smallPanelOrder = minimized
    ? Object.keys(panels)
    : Object.keys(panels).filter((k) => !expandedPanels.includes(k));

  return (
    <>
      <S.DraggableBar />
      {Object.entries(panels).map(([key, panel]) => {
        let x: number;
        let y: number;
        let width: number;
        let height: number;

        if (key in expandedPanels) {
          x = 0;
          y = 0;
          width = windowSize.width;
          height = windowSize.height;
        } else {
          const orderPosition = smallPanelOrder.indexOf(key);
          x = 8;
          y = 8 + orderPosition * (135 + 8);
          width = 240;
          height = 135;
        }

        if (panel.type === 'map') {
          if (colyseusRoom == null) {
            return null;
          }

          return (
            <S.PanelWrapper
              className="wrap-that"
              key={key}
              x={x}
              y={y}
              width={width}
              height={height}
            >
              <MapPanel key={key} colyseusRoom={colyseusRoom} />;
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
            <S.PanelWrapper key={key} x={x} y={y} width={width} height={height}>
              <RemoteUserPanel participant={participant}></RemoteUserPanel>
            </S.PanelWrapper>
          );
        }
        return null;
      })}
    </>
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