import * as S from './MapPanel.styles';
import React from 'react';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import useResizeObserver from 'use-resize-observer';
import * as _ from 'lodash';
import * as TWEEN from '@tweenjs/tween.js';
import Icon from './Icon';
import { Room, createLocalVideoTrack } from 'twilio-video';
import { LocalMediaContext } from '../contexts/LocalMediaContext';

export interface MapPanelProps {
  className?: string;
  colyseusRoom: Colyseus.Room;
  minimized: boolean;
  onPlayerDistanceChanged(identity: string, distance: number): void;
}

const MapPanel: React.FC<MapPanelProps> = ({
  className,
  colyseusRoom,
  minimized,
  onPlayerDistanceChanged,
}) => {
  const {
    localVideoEnabled,
    localAudioEnabled,
    enableLocalVideo,
    disableLocalVideo,
    enableLocalAudio,
    disableLocalAudio,
  } = React.useContext(LocalMediaContext);

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const windowSize = React.useRef<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const localPlayerRef = React.useRef<{
    identity: string;
    x: number;
    y: number;
    dir: number;
    speed: number;
  } | null>(null);

  const scaleRef = React.useRef(1);

  const pixiApp = React.useMemo(() => {
    const app = new PIXI.Application({
      width: windowSize.current.width,
      height: windowSize.current.height,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    console.log('Creating PIXI app', app);

    return app;
  }, []);

  const mapWorldCoordToPixiCoord = (x: number, y: number) => {
    const angle = Math.PI / 6;
    const mappedX = x * 32 * Math.cos(angle) - y * 32 * Math.cos(angle);
    const mappedY = y * 32 * Math.sin(angle) + x * 32 * Math.sin(angle);
    return [mappedX, mappedY];
  };

  const centerCameraAround = React.useCallback(
    (x: number, y: number) => {
      pixiApp.stage.scale.x = scaleRef.current;
      pixiApp.stage.scale.y = scaleRef.current;
      pixiApp.stage.position.x =
        -x * scaleRef.current + windowSize.current.width / 2;
      pixiApp.stage.position.y =
        -y * scaleRef.current + windowSize.current.height / 2;
    },
    [colyseusRoom, pixiApp]
  );

  React.useEffect(() => {
    scaleRef.current = minimized ? 0.5 : 1;
  }, [minimized]);

  useResizeObserver({
    ref: wrapperRef,
    onResize(size) {
      if (size.width != null && size.height != null) {
        windowSize.current = { width: size.width, height: size.height };
        pixiApp.renderer.resize(size.width, size.height);
        if (localPlayerRef.current != null) {
          centerCameraAround(
            localPlayerRef.current.x,
            localPlayerRef.current.y
          );
        }
      }
    },
  });

  React.useEffect(() => {
    const playerGraphics: {
      [sessionId: string]: PIXI.Graphics;
    } = {};

    const worldObjectGraphics = new WeakMap<any, PIXI.Graphics>();

    let lastFrameTime = Date.now();
    const animate = (time: number) => {
      const delta = (time - lastFrameTime) / 1000;
      lastFrameTime = time;

      const localPlayer = localPlayerRef.current;

      if (localPlayer != null) {
        localPlayer.x += localPlayer.speed * Math.cos(localPlayer.dir) * delta;
        localPlayer.y -= localPlayer.speed * Math.sin(localPlayer.dir) * delta;

        const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
          localPlayer.x,
          localPlayer.y
        );
        playerGraphics[colyseusRoom.sessionId].x = mappedX;
        playerGraphics[colyseusRoom.sessionId].y = mappedY;

        centerCameraAround(mappedX, mappedY);

        colyseusRoom.state.players.forEach((player: any) => {
          if (player.identity === localPlayer.identity) {
            return;
          }

          const dist = Math.sqrt(
            (player.x - localPlayer.x) ** 2 + (player.y - localPlayer.y) ** 2
          );
          onPlayerDistanceChanged(player.identity, dist);
        });

        colyseusRoom.send('setPlayerPosition', {
          x: localPlayer.x,
          y: localPlayer.y,
        });
      }

      TWEEN.update(time);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    colyseusRoom.state.players.onAdd = (player: any, sessionId: any) => {
      console.log('Colyseus player added', player);

      const graphic = new PIXI.Graphics();
      graphic.beginFill(0xffffff);
      graphic.drawCircle(0, 0, 16);
      graphic.endFill();
      pixiApp.stage.addChild(graphic);

      const [mappedX, mappedY] = mapWorldCoordToPixiCoord(player.x, player.y);
      graphic.x = mappedX;
      graphic.y = mappedY;

      playerGraphics[sessionId] = graphic;

      if (sessionId === colyseusRoom.sessionId) {
        console.log('Got initial local player state', player);
        localPlayerRef.current = {
          identity: player.identity,
          x: player.x,
          y: player.y,
          dir: player.dir,
          speed: player.speed,
        };
      } else {
        player.onChange = () => {
          const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
            player.x,
            player.y
          );

          new TWEEN.Tween(graphic)
            .to({ x: mappedX, y: mappedY }, 80)
            .easing(TWEEN.Easing.Linear.None)
            .start();

          console.log('Remote player changed', Date.now(), player);
          const localPlayer = localPlayerRef.current;
          if (localPlayer != null) {
            const dist = Math.sqrt(
              (player.x - localPlayer.x) ** 2 + (player.y - localPlayer.y) ** 2
            );
            onPlayerDistanceChanged(player.identity, dist);
          }
        };
      }
    };

    colyseusRoom.state.players.onRemove = (player: any, sessionId: any) => {
      console.log('Colyseus player removed', player);
      pixiApp?.stage.removeChild(playerGraphics[sessionId]);
      delete playerGraphics[sessionId];
    };

    colyseusRoom.state.worldObjects.onAdd = (worldObject: any) => {
      const graphic = new PIXI.Graphics();

      graphic.beginFill(0x444444);
      graphic.drawEllipse(0, 0, 3, 1.5);
      graphic.endFill();

      const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
        worldObject.x,
        worldObject.y
      );
      graphic.x = mappedX;
      graphic.y = mappedY;

      pixiApp.stage.addChild(graphic);

      worldObjectGraphics.set(worldObject, graphic);
    };

    colyseusRoom.state.worldObjects.onRemove = (worldObject: any) => {
      const graphic = worldObjectGraphics.get(worldObject);
      if (graphic != null) {
        pixiApp?.stage.removeChild(graphic);
        worldObjectGraphics.delete(worldObject);
      }
    };
  }, [colyseusRoom, pixiApp, centerCameraAround]);

  React.useEffect(() => {
    wrapperRef.current?.appendChild(pixiApp.view);

    return () => {
      wrapperRef.current?.removeChild(pixiApp.view);
      pixiApp.destroy();
    };
  }, [pixiApp]);

  const heldCommands = React.useRef<{ [key: string]: boolean }>({});

  const getDir = React.useCallback(() => {
    const commands = heldCommands.current;
    if (commands.right && commands.up) {
      return Math.PI / 2;
    }
    if (commands.right && commands.down) {
      return 0;
    }
    if (commands.left && commands.down) {
      return -Math.PI / 2;
    }
    if (commands.left && commands.up) {
      return -Math.PI;
    }
    if (commands.right) {
      return Math.PI / 4;
    }
    if (commands.down) {
      return -Math.PI / 4;
    }
    if (commands.left) {
      return (Math.PI * 5) / 4;
    }
    if (commands.up) {
      return (Math.PI * 3) / 4;
    }
    return null;
  }, []);

  const getSpeed = React.useCallback(() => {
    const commands = heldCommands.current;
    if (commands.right || commands.up || commands.left || commands.down) {
      return 5;
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
      const localPlayer = localPlayerRef.current;
      if (localPlayer == null) {
        return;
      }

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
        const dir = getDir();

        if (dir != null) {
          colyseusRoom.send('setPlayerDirection', dir);
          localPlayer.dir = dir;
        }

        const speed = getSpeed();
        colyseusRoom.send('setPlayerSpeed', speed);
        localPlayer.speed = speed;
      }
    },
    [colyseusRoom]
  );

  const onKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      const localPlayer = localPlayerRef.current;
      if (localPlayer == null) {
        return;
      }

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
        const dir = getDir();

        if (dir != null) {
          colyseusRoom.send('setPlayerDirection', dir);
          localPlayer.dir = dir;
        }

        const speed = getSpeed();
        colyseusRoom.send('setPlayerSpeed', speed);
        localPlayer.speed = speed;
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

  return (
    <S.Wrapper className={className} ref={wrapperRef} minimized={minimized}>
      <S.IconButtons>
        <S.IconButton
          name={localAudioEnabled ? 'mic' : 'mic_off'}
          disabled={!localAudioEnabled}
          onClick={() => {
            if (localAudioEnabled) {
              disableLocalAudio();
            } else {
              enableLocalAudio();
            }
          }}
        />
        <S.IconButton
          name={localVideoEnabled ? 'videocam' : 'videocam_off'}
          disabled={!localVideoEnabled}
          onClick={() => {
            if (localVideoEnabled) {
              disableLocalVideo();
            } else {
              enableLocalVideo();
            }
          }}
        />
      </S.IconButtons>
    </S.Wrapper>
  );
};

export default MapPanel;
