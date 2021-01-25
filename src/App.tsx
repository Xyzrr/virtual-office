import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import {
  connect,
  LocalAudioTrack,
  LocalParticipant,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteVideoTrack,
} from 'twilio-video';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import * as S from './App.styles';
import { useFakeMinimize } from './util/useFakeMinimize';
import produce from 'immer';
import { objectTraps } from 'immer/dist/internal';
import RemoteUserPanel from './components/RemoteUserPanel';

interface MapPanelData {
  type: 'map';
}

interface LocalUserPanelData {
  type: 'local-user';
  participant: LocalParticipant;
}

interface RemoteUserPanelData {
  type: 'remote-user';
  participant: RemoteParticipant;
}

export type PanelData = MapPanelData | LocalUserPanelData | RemoteUserPanelData;

const Hello = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLDivElement>(null);
  const appRef = React.useRef<PIXI.Application | null>(null);
  const roomRef = React.useRef<Colyseus.Room | null>(null);
  const [panels, setPanels] = React.useState<{ [key: string]: PanelData }>({
    map: { type: 'map' },
  });

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
        audio: true,
        video: { width: 320 },
      }).then(
        (room) => {
          console.log('Joined room');

          room.participants.forEach((participant) => {
            const panelId = `remote-user-${participant.identity}`;
            setPanels(
              produce(panels, (draft: { [key: string]: PanelData }) => {
                draft[panelId] = { type: 'remote-user', participant };
              })
            );
          });

          room.on('participantConnected', (participant) => {
            console.log(`Remote participant connected: ${participant}`);
            const panelId = `remote-user-${participant.identity}`;
            setPanels(
              produce(panels, (draft: { [key: string]: PanelData }) => {
                draft[panelId] = { type: 'remote-user', participant };
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
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });
    appRef.current = app;

    const container = containerRef.current;

    if (container == null) {
      return undefined;
    }

    container.appendChild(app.view);

    return () => {
      container.removeChild(app.view);
      app.destroy();
    };
  }, []);

  React.useEffect(() => {
    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 32; j++) {
        const dot = new PIXI.Graphics();

        dot.beginFill(0x444444);
        dot.drawCircle(i * 32, j * 32, 2);
        dot.endFill();

        appRef.current?.stage.addChild(dot);
      }
    }
  }, []);

  React.useEffect(() => {
    const client = new Colyseus.Client(
      'ws://virtual-office-server.herokuapp.com'
    );
    // const client = new Colyseus.Client('ws://localhost:3434');
    const playerGraphics: { [sessionId: string]: PIXI.Graphics } = {};

    client.joinOrCreate('main').then((room: Colyseus.Room<any>) => {
      roomRef.current = room;

      room.state.players.onAdd = (player: any, sessionId: any) => {
        console.log('add playserssarz');
        const graphic = new PIXI.Graphics();
        graphic.beginFill(0xffffff);
        graphic.drawCircle(player.x, player.y, 16);
        graphic.endFill();
        appRef.current?.stage.addChild(graphic);

        player.onChange = () => {
          graphic.x = player.x;
          graphic.y = player.y;
        };

        playerGraphics[sessionId] = graphic;
      };

      console.log('state', room.state);

      room.state.players.onRemove = (player: any, sessionId: any) => {
        appRef.current?.stage.removeChild(playerGraphics[sessionId]);
        delete playerGraphics[sessionId];
      };
    });

    return () => {
      roomRef.current?.leave(false);
    };
  }, []);

  const onResize = React.useCallback(() => {
    appRef.current?.renderer.resize(window.innerWidth, window.innerHeight);
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

  const onKeyDown = React.useCallback((e: KeyboardEvent) => {
    keys.current[e.key] = true;
    console.log('dirz', getDir());
    if (
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft'
    ) {
      roomRef.current?.send('setMovement', { dir: getDir(), speed: 100 });
    }
  }, []);

  const onKeyUp = React.useCallback((e: KeyboardEvent) => {
    delete keys.current[e.key];
    if (
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft'
    ) {
      roomRef.current?.send('setMovement', {
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
  }, []);

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  useFakeMinimize();

  return (
    <>
      <S.DraggableBar />
      <S.Container ref={containerRef} />
      {Object.entries(panels).map(([key, panel]) => {
        if (panel.type === 'remote-user') {
          return (
            <RemoteUserPanel
              key={key}
              participant={panel.participant}
            ></RemoteUserPanel>
          );
        }
      })}
      <S.TracksContainer ref={videoRef} />
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
