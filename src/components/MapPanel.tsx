import * as S from './MapPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import useResizeObserver from 'use-resize-observer';
import * as _ from 'lodash';
import * as TWEEN from '@tweenjs/tween.js';

import HoverMenu from './HoverMenu';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import PanelWrapper from './PanelWrapper';
import { DARK_BACKGROUND } from './constants';
import { ColyseusContext, ColyseusEvent } from '../contexts/ColyseusContext';

export interface MapPanelProps {
  className?: string;

  x: number;
  y: number;
  width: number;
  height: number;

  localPlayerIdentity: string;
  small: boolean;
  onSetExpanded(value: boolean): void;
}

const MapPanel: React.FC<MapPanelProps> = React.memo(
  ({
    className,
    x,
    y,
    width,
    height,
    localPlayerIdentity,
    small,
    onSetExpanded,
  }) => {
    const {
      room: colyseusRoom,
      addListener: addColyseusListener,
      removeListener: removeColyseusListener,
    } = React.useContext(ColyseusContext);

    const localPlayerRef = React.useRef<
      | {
          x: number;
          y: number;
          dir: number;
          speed: number;
        }
      | undefined
    >();
    const playerGraphicsRef = React.useRef<{
      [identity: string]: PIXI.Graphics;
    }>({});
    const worldObjectGraphicsRef = React.useRef(
      new WeakMap<any, PIXI.Graphics>()
    );
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const windowSize = React.useRef<{ width: number; height: number }>({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const scaleRef = React.useRef(1);

    const pixiApp = React.useMemo(() => {
      const app = new PIXI.Application({
        width: windowSize.current.width,
        height: windowSize.current.height,
        antialias: !process.env.LOW_POWER,
        resolution: process.env.LOW_POWER ? 1 : window.devicePixelRatio,
        autoDensity: true,
        backgroundColor: DARK_BACKGROUND.rgbNumber(),
      });
      app.stage.sortableChildren = true;

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
      scaleRef.current = small ? 0.5 : 1;
    }, [small]);

    useResizeObserver({
      ref: wrapperRef,
      onResize(size) {
        if (size.width != null && size.height != null) {
          windowSize.current = { width: size.width, height: size.height };
          pixiApp.renderer.resize(size.width, size.height);

          if (localPlayerRef.current) {
            const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
              localPlayerRef.current.x,
              localPlayerRef.current.y
            );

            centerCameraAround(mappedX, mappedY);
          }
        }
      },
    });

    React.useEffect(() => {
      if (!colyseusRoom) {
        return;
      }

      let lastFrameTime = Date.now();
      const animate = (time: number) => {
        const delta = (time - lastFrameTime) / 1000;
        lastFrameTime = time;

        const localPlayer = localPlayerRef.current;

        if (localPlayer) {
          localPlayer.x +=
            localPlayer.speed * Math.cos(localPlayer.dir) * delta;
          localPlayer.y -=
            localPlayer.speed * Math.sin(localPlayer.dir) * delta;

          for (const [
            identity,
            player,
          ] of colyseusRoom.state.players.entries()) {
            if (identity === localPlayerIdentity) {
              continue;
            }

            const dist = Math.sqrt(
              (player.x - localPlayer.x) ** 2 + (player.y - localPlayer.y) ** 2
            );

            if (dist < 0.8) {
              console.log('Pushed by:', identity, 'Self:', localPlayerIdentity);

              const atan = Math.atan(
                (localPlayer.y - player.y) / (player.x - localPlayer.x)
              );
              const dir = player.x > localPlayer.x ? atan : atan + Math.PI;
              const pushDir = dir + Math.PI;
              const pushDist = 0.1 / (dist + 0.8);

              localPlayer.x += Math.cos(pushDir) * pushDist;
              localPlayer.y -= Math.sin(pushDir) * pushDist;
            }
          }

          const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
            localPlayer.x,
            localPlayer.y
          );
          playerGraphicsRef.current[localPlayerIdentity].x = mappedX;
          playerGraphicsRef.current[localPlayerIdentity].y = mappedY;

          centerCameraAround(mappedX, mappedY);

          colyseusRoom.send('setPlayerPosition', {
            x: localPlayer.x,
            y: localPlayer.y,
          });
        }

        TWEEN.update(time);

        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, [colyseusRoom, pixiApp, centerCameraAround]);

    React.useEffect(() => {
      if (!colyseusRoom) {
        return;
      }

      const events: ColyseusEvent[] = [
        'player-added',
        'player-updated',
        'player-removed',
      ];

      const onPlayersUpdated = () => {
        for (const [identity, player] of colyseusRoom.state.players.entries()) {
          if (!playerGraphicsRef.current[identity]) {
            if (identity === localPlayerIdentity) {
              localPlayerRef.current = {
                x: player.x,
                y: player.y,
                dir: player.dir,
                speed: player.speed,
              };
            }

            const graphic = new PIXI.Graphics()
              .beginFill(player.color)
              .drawCircle(0, 0, 16)
              .endFill();
            // const text = new PIXI.Text(
            //   'John',
            //   new PIXI.TextStyle({
            //     fill: '#fff',
            //     fontSize: 14,
            //     align: 'center',
            //     dropShadow: true,
            //     dropShadowColor: '#f00',
            //     dropShadowBlur: 4,
            //   })
            // );
            // text.anchor.x = 0.5;
            // text.x = 0;
            // text.y = -40;
            // graphic.addChild(text);
            playerGraphicsRef.current[identity] = graphic;
            pixiApp.stage.addChild(graphic);

            const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
              player.x,
              player.y
            );
            graphic.x = mappedX;
            graphic.y = mappedY;
          }

          const graphic = playerGraphicsRef.current[identity];

          // TODO: This is super inefficient.
          graphic
            .clear()
            .beginFill(player.color)
            .drawCircle(0, 0, 16)
            .endFill();

          if (identity !== localPlayerIdentity) {
            const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
              player.x,
              player.y
            );

            if (mappedX !== graphic.x || mappedY != graphic.y) {
              new TWEEN.Tween(graphic)
                .to({ x: mappedX, y: mappedY }, 80)
                .easing(TWEEN.Easing.Linear.None)
                .start();

              console.log('Remote player changed', Date.now(), player);
            }
          }
        }

        for (const [identity, graphic] of Object.entries(
          playerGraphicsRef.current
        )) {
          if (!colyseusRoom.state.players.has(identity)) {
            pixiApp?.stage.removeChild(playerGraphicsRef.current[identity]);
            delete playerGraphicsRef.current[identity];
          }
        }
      };

      onPlayersUpdated();

      for (const event of events) {
        addColyseusListener(event, onPlayersUpdated);
      }

      colyseusRoom.state.worldObjects.onAdd = (worldObject: any) => {
        const graphic = new PIXI.Graphics();

        graphic.beginFill(0x444444);
        graphic.drawEllipse(0, 0, 2 * Math.sqrt(3), 2);
        graphic.endFill();
        graphic.zIndex = -1;

        const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
          worldObject.x,
          worldObject.y
        );
        graphic.x = mappedX;
        graphic.y = mappedY;

        pixiApp.stage.addChild(graphic);

        worldObjectGraphicsRef.current.set(worldObject, graphic);
      };

      colyseusRoom.state.worldObjects.onRemove = (worldObject: any) => {
        const graphic = worldObjectGraphicsRef.current.get(worldObject);
        if (graphic != null) {
          pixiApp?.stage.removeChild(graphic);
          worldObjectGraphicsRef.current.delete(worldObject);
        }
      };

      return () => {
        for (const event of events) {
          removeColyseusListener(event, onPlayersUpdated);
        }
      };
    }, [colyseusRoom, pixiApp]);

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
      D: 'right',
      W: 'up',
      A: 'left',
      S: 'down',
    };

    const onKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        if (!colyseusRoom) {
          return;
        }

        if (
          document.activeElement &&
          document.activeElement.tagName === 'INPUT'
        ) {
          return;
        }

        if (e.metaKey) {
          return;
        }

        const localPlayer = localPlayerRef.current;
        if (!localPlayer) {
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
      [colyseusRoom, localPlayerIdentity]
    );

    const onKeyUp = React.useCallback(
      (e: KeyboardEvent) => {
        if (!colyseusRoom) {
          return;
        }

        const localPlayer = localPlayerRef.current;
        if (!localPlayer) {
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
      [colyseusRoom, localPlayerIdentity]
    );

    React.useEffect(() => {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }, [onKeyUp, onKeyDown]);

    const mouseIsIdle = useMouseIsIdle({ containerRef: wrapperRef });

    return (
      <S.MapPanelWrapper
        x={x}
        y={y}
        z={small ? 2 : 0}
        width={width}
        height={height}
        xDirection="left"
        floating={small}
      >
        <S.Wrapper className={className} ref={wrapperRef} small={small}>
          {small && (
            <HoverMenu hidden={mouseIsIdle}>
              <HoverMenuStyles.MenuItem
                name={small ? 'fullscreen' : 'fullscreen_exit'}
                onClick={() => {
                  onSetExpanded(!!small);
                }}
              ></HoverMenuStyles.MenuItem>
            </HoverMenu>
          )}
        </S.Wrapper>
      </S.MapPanelWrapper>
    );
  }
);

export default MapPanel;
