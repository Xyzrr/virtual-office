import * as S from './MapPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import * as _ from 'lodash';
import * as TWEEN from '@tweenjs/tween.js';

import HoverMenu from './HoverMenu';
import { useMouseIsIdle } from '../util/useMouseIsIdle';
import { DARK_BACKGROUND, LIGHT_BACKGROUND, PLAYER_RADIUS } from './constants';
import { ColyseusContext, ColyseusEvent } from '../contexts/ColyseusContext';
import * as THREE from 'three';

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

    const [zoomLevel, setZoomLevel] = React.useState(1);
    const adjustedZoomLevel = zoomLevel * (small ? 0.5 : 1);

    const fpsRef = React.useRef(30);

    const glRenderer = React.useMemo(() => {
      const glRenderer = new THREE.WebGLRenderer();
      glRenderer.setPixelRatio(
        process.env.LOW_POWER ? 1 : window.devicePixelRatio
      );
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
        -width / 2 / adjustedZoomLevel,
        width / 2 / adjustedZoomLevel,
        height / 2 / adjustedZoomLevel,
        -height / 2 / adjustedZoomLevel,
        1,
        10000
      );
      // const camera = new THREE.PerspectiveCamera(75, 2, 1, 1000);
      camera.position.set(1000, -1000, (1000 * Math.sqrt(2)) / Math.sqrt(3));
      camera.rotateZ(Math.PI / 4);
      camera.rotateX(Math.PI / 3);
      return camera;
    }, []);

    const centerCameraOnPoint = (x: number, y: number) => {
      camera.position.set(
        1000 + x,
        -1000 + y,
        (1000 * Math.sqrt(2)) / Math.sqrt(3)
      );
    };

    React.useEffect(() => {
      glRenderer.setSize(width, height);
      camera.left = -width / 2 / adjustedZoomLevel;
      camera.right = width / 2 / adjustedZoomLevel;
      camera.bottom = -height / 2 / adjustedZoomLevel;
      camera.top = height / 2 / adjustedZoomLevel;
      camera.updateProjectionMatrix();

      if (localPlayerRef.current == null) {
        return;
      }

      centerCameraOnPoint(localPlayerRef.current.x, localPlayerRef.current.y);
    }, [width, height, adjustedZoomLevel]);

    const onPositionChanged = React.useCallback(() => {
      const localPlayer = localPlayerRef.current;

      if (!localPlayer) {
        return;
      }

      const localPlayerGraphic = playerGraphicsRef.current[localPlayerIdentity];

      if (!localPlayerGraphic) {
        return;
      }

      localPlayerGraphic.position.setX(localPlayer.x);
      localPlayerGraphic.position.setY(localPlayer.y);

      centerCameraOnPoint(localPlayer.x, localPlayer.y);

      colyseusRoom?.send('setPlayerPosition', {
        x: localPlayer.x,
        y: localPlayer.y,
      });
    }, [localPlayerIdentity, colyseusRoom]);

    React.useEffect(() => {
      if (!colyseusRoom) {
        return;
      }

      let animationFrame: number;
      let lastFrameTime = Date.now();
      let lastRenderedFrameTime = Date.now();
      const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        const time = Date.now();

        const delta = (time - lastFrameTime) / 1000;
        lastFrameTime = time;

        const localPlayer = localPlayerRef.current;

        if (localPlayer) {
          let positionChanged = localPlayer.speed > 0;

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

            if (dist < PLAYER_RADIUS * 2) {
              console.log('DIST IS', dist);
              console.log('Pushed by:', identity, 'Self:', localPlayerIdentity);

              const atan = Math.atan(
                (localPlayer.y - player.y) / (player.x - localPlayer.x)
              );
              const dir = player.x > localPlayer.x ? atan : atan + Math.PI;
              const pushDir = dir + Math.PI;
              const pushDist = (PLAYER_RADIUS * 2) / (dist + PLAYER_RADIUS);

              localPlayer.x += Math.cos(pushDir) * pushDist;
              localPlayer.y -= Math.sin(pushDir) * pushDist;

              positionChanged = true;
            }
          }

          if (positionChanged) {
            onPositionChanged();
          }
        }

        if (time - lastRenderedFrameTime < 1000 / fpsRef.current) {
          return;
        }

        lastRenderedFrameTime = time;

        TWEEN.update(time);

        glRenderer.render(scene, camera);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }, [colyseusRoom, glRenderer, onPositionChanged]);

    React.useEffect(() => {
      if (!colyseusRoom) {
        return;
      }

      colyseusRoom.state.worldObjects.onAdd = (worldObject: any) => {
        const geometry = new THREE.SphereBufferGeometry(4);
        const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const sphere = new THREE.Mesh(geometry, material);

        scene.add(sphere);
        sphere.position.setX(worldObject.x);
        sphere.position.setY(worldObject.y);

        worldObjectGraphicsRef.current.set(worldObject, sphere);

        console.log('ADDED WORLD OBJECT:', worldObject);
        console.log('Number of things:', scene.children.length);
      };

      colyseusRoom.state.worldObjects.onRemove = (worldObject: any) => {
        const graphic = worldObjectGraphicsRef.current.get(worldObject);
        if (graphic != null) {
          scene.remove(graphic);
          worldObjectGraphicsRef.current.delete(worldObject);
          console.log('REMOVED WORLD OBJECT:', worldObject);
        } else {
          console.log('WORLD OBJECT ALREADY REMOVED:', worldObject);
        }
      };
    }, [colyseusRoom, scene]);

    React.useEffect(() => {
      const onPlayerAdded = ({ identity, player }: any) => {
        console.log('PLAYER ADDED:', identity);
        const geometry = new THREE.SphereBufferGeometry(PLAYER_RADIUS, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: player.color,
        });
        const sphere = new THREE.Mesh(geometry, material);

        playerGraphicsRef.current[identity] = sphere;
        scene.add(sphere);

        if (identity === localPlayerIdentity) {
          localPlayerRef.current = {
            x: player.x,
            y: player.y,
            dir: player.dir,
            speed: player.speed,
          };
          onPositionChanged();
        } else {
          sphere.position.setX(player.x);
          sphere.position.setY(player.y);
        }
      };

      const onPlayerUpdated = ({ identity, player }: any) => {
        console.log('PLAYER UPDATED:', identity);
        const graphic = playerGraphicsRef.current[identity];
        (graphic.material as THREE.MeshBasicMaterial).color.setHex(
          player.color
        );

        if (identity !== localPlayerIdentity) {
          graphic.position.setX(player.x);
          graphic.position.setY(player.y);
        }
      };

      const onPlayerRemoved = ({ identity }: any) => {
        console.log('PLAYER REMOVED:', identity);
        scene.remove(playerGraphicsRef.current[identity]);
        delete playerGraphicsRef.current[identity];
      };

      addColyseusListener('player-added', onPlayerAdded);
      addColyseusListener('player-updated', onPlayerUpdated);
      addColyseusListener('player-removed', onPlayerRemoved);

      return () => {
        removeColyseusListener('player-added', onPlayerAdded);
        removeColyseusListener('player-updated', onPlayerUpdated);
        removeColyseusListener('player-removed', onPlayerRemoved);
      };
    }, [colyseusRoom, scene, onPositionChanged]);

    React.useEffect(() => {
      if (colyseusRoom == null) {
        return;
      }

      return () => {
        playerGraphicsRef.current = {};
        worldObjectGraphicsRef.current = new WeakMap();
        scene.clear();
      };
    }, [colyseusRoom, scene]);

    React.useEffect(() => {
      wrapperRef.current?.appendChild(glRenderer.domElement);

      return () => {
        wrapperRef.current?.removeChild(glRenderer.domElement);
        glRenderer.dispose();
      };
    }, [glRenderer]);

    React.useEffect(() => {
      if (colyseusRoom == null) {
        return;
      }

      const removeOnCommand = colyseusRoom.onMessage('command', (options) => {
        if (options.type === 'fps') {
          fpsRef.current = parseInt(options.args[0]);
        }

        if (options.type === 'pixelRatio') {
          glRenderer.setPixelRatio(parseInt(options.args[0]));
        }
      });

      return () => {
        removeOnCommand();
      };
    }, [colyseusRoom]);

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
        return 128;
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
