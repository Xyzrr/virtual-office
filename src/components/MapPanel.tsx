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
import * as THREE from 'three';
import { useImmer } from 'use-immer';

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
      [identity: string]: THREE.Mesh;
    }>({});
    const worldObjectGraphicsRef = React.useRef(new WeakMap<any, THREE.Mesh>());
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const windowSize = React.useRef<{ width: number; height: number }>({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const scaleRef = React.useRef(1);

    const glRenderer = React.useMemo(() => {
      const glRenderer = new THREE.WebGLRenderer();
      glRenderer.setPixelRatio(window.devicePixelRatio);
      glRenderer.setSize(width, height);
      glRenderer.shadowMap.enabled = true;
      console.log('Creating THREE renderer', glRenderer);
      return glRenderer;
    }, []);

    const scene = React.useMemo(() => {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(DARK_BACKGROUND.rgbNumber());
      return scene;
    }, []);

    const camera = React.useMemo(() => {
      const camera = new THREE.OrthographicCamera(
        -width / 20,
        width / 20,
        height / 20,
        -height / 20,
        1,
        1000
      );
      // const camera = new THREE.PerspectiveCamera(75, 2, 1, 1000);
      camera.position.set(100, -100, 100);
      camera.rotateZ(Math.PI / 4);
      camera.rotateX(Math.PI / 3);
      return camera;
    }, []);

    const mapWorldCoordToPixiCoord = (x: number, y: number) => {
      const angle = Math.PI / 6;
      const mappedX = x * 32 * Math.cos(angle) - y * 32 * Math.cos(angle);
      const mappedY = y * 32 * Math.sin(angle) + x * 32 * Math.sin(angle);
      return [mappedX, mappedY];
    };

    React.useEffect(() => {
      scaleRef.current = small ? 0.5 : 1;
    }, [small]);

    // useResizeObserver({
    //   ref: wrapperRef,
    //   onResize(size) {
    //     if (size.width != null && size.height != null) {
    //       windowSize.current = { width: size.width, height: size.height };
    //       pixiApp.renderer.resize(size.width, size.height);

    //       if (localPlayerRef.current) {
    //         const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
    //           localPlayerRef.current.x,
    //           localPlayerRef.current.y
    //         );

    //         centerCameraAround(mappedX, mappedY);
    //       }
    //     }
    //   },
    // });

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
          localPlayer.y +=
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
          playerGraphicsRef.current[localPlayerIdentity].position.setX(
            localPlayer.x
          );
          playerGraphicsRef.current[localPlayerIdentity].position.setY(
            localPlayer.y
          );

          colyseusRoom.send('setPlayerPosition', {
            x: localPlayer.x,
            y: localPlayer.y,
          });
        }

        TWEEN.update(time);

        glRenderer.render(scene, camera);

        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, [colyseusRoom, glRenderer]);

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

            const geometry = new THREE.SphereGeometry(5, 32, 32);
            const material = new THREE.MeshBasicMaterial({
              color: player.color,
            });
            const sphere = new THREE.Mesh(geometry, material);

            playerGraphicsRef.current[identity] = sphere;
            scene.add(sphere);

            sphere.position.setX(player.x);
            sphere.position.setY(player.y);
          }

          const graphic = playerGraphicsRef.current[identity];
          (graphic.material as THREE.MeshBasicMaterial).color.setHex(
            player.color
          );

          if (identity !== localPlayerIdentity) {
            graphic.position.setX(player.x);
            graphic.position.setY(player.y);
          }
        }

        for (const [identity, graphic] of Object.entries(
          playerGraphicsRef.current
        )) {
          if (!colyseusRoom.state.players.has(identity)) {
            scene.remove(playerGraphicsRef.current[identity]);
            delete playerGraphicsRef.current[identity];
          }
        }
      };

      onPlayersUpdated();

      for (const event of events) {
        addColyseusListener(event, onPlayersUpdated);
      }

      colyseusRoom.state.worldObjects.onAdd = (worldObject: any) => {
        const geometry = new THREE.SphereGeometry(0.4, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const sphere = new THREE.Mesh(geometry, material);

        scene.add(sphere);
        sphere.position.setX(worldObject.x);
        sphere.position.setY(worldObject.y);

        worldObjectGraphicsRef.current.set(worldObject, sphere);
      };

      colyseusRoom.state.worldObjects.onRemove = (worldObject: any) => {
        const graphic = worldObjectGraphicsRef.current.get(worldObject);
        if (graphic != null) {
          scene.remove(graphic);
          worldObjectGraphicsRef.current.delete(worldObject);
        }
      };

      return () => {
        for (const event of events) {
          removeColyseusListener(event, onPlayersUpdated);
        }
      };
    }, [colyseusRoom, scene]);

    React.useEffect(() => {
      wrapperRef.current?.appendChild(glRenderer.domElement);

      return () => {
        wrapperRef.current?.removeChild(glRenderer.domElement);
        glRenderer.dispose();
      };
    }, [glRenderer]);

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
