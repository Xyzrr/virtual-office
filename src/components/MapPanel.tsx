import * as S from './MapPanel.styles';
import React from 'react';
import * as PIXI from 'pixi.js';
import * as Colyseus from 'colyseus.js';
import useResizeObserver from 'use-resize-observer';
import * as _ from 'lodash';
import * as TWEEN from '@tweenjs/tween.js';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { useVolume } from '../util/useVolume';
import { desktopCapturer } from 'electron';
import {
  createLocalTracks,
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalVideoTrack,
} from 'twilio-video';
import { connect } from 'http2';
import NewWindow from './NewWindow';
import ScreenSharePicker from './ScreenSharePicker';

export interface MapPanelProps {
  className?: string;
  localPlayerIdentity: string;
  colyseusRoom: Colyseus.Room;
  small: boolean;
  onPlayerDistanceChanged(identity: string, distance: number): void;
  onPlayerAudioEnabledChanged(identity: string, audioEnabled: boolean): void;
}

const MapPanel: React.FC<MapPanelProps> = ({
  className,
  localPlayerIdentity,
  colyseusRoom,
  small,
  onPlayerDistanceChanged,
  onPlayerAudioEnabledChanged,
}) => {
  const {
    localVideoInputEnabled,
    localAudioInputEnabled,
    localAudioOutputEnabled,
    localScreenShareEnabled,
    localAudioTrack,
    localAudioInputDeviceId,
    localAudioOutputDeviceId,
    localVideoInputDeviceId,
    enableLocalVideoInput,
    disableLocalVideoInput,
    enableLocalAudioInput,
    disableLocalAudioInput,
    setLocalAudioOutputEnabled,
    setLocalAudioInputDeviceId,
    setLocalAudioOutputDeviceId,
    setLocalVideoInputDeviceId,
    screenShare,
    stopScreenShare,
  } = React.useContext(LocalMediaContext);

  console.log('MICROPHONE ID', localAudioInputDeviceId);

  const [mediaDevices, setMediaDevices] = React.useState<MediaDeviceInfo[]>([]);

  const [volume, setVolume] = React.useState(0);
  const [recentlyLoud, setRecentlyLoud] = React.useState(false);
  const recentlyLoudTimerRef = React.useRef<number | null>(null);

  const [screenSharePickerOpen, setScreenSharePickerOpen] = React.useState(
    false
  );

  useVolume(localAudioTrack, (v) => {
    setVolume(v);
    if (v > 0.15) {
      if (recentlyLoudTimerRef.current != null) {
        window.clearTimeout(recentlyLoudTimerRef.current);
        recentlyLoudTimerRef.current = null;
      }

      setRecentlyLoud(true);

      recentlyLoudTimerRef.current = window.setTimeout(() => {
        setRecentlyLoud(false);
        recentlyLoudTimerRef.current = null;
      }, 500);
    }
  });

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const windowSize = React.useRef<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const localPlayerRef = React.useRef<{
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
        if (localPlayerRef.current != null) {
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

        colyseusRoom.state.players.forEach((player: any) => {
          if (player.identity === localPlayerIdentity) {
            return;
          }

          const dist = Math.sqrt(
            (player.x - localPlayer.x) ** 2 + (player.y - localPlayer.y) ** 2
          );

          if (dist < 0.8) {
            console.log(
              'Pushed by:',
              player.identity,
              'Self:',
              localPlayerIdentity
            );

            const atan = Math.atan(
              (localPlayer.y - player.y) / (player.x - localPlayer.x)
            );
            const dir = player.x > localPlayer.x ? atan : atan + Math.PI;
            const pushDir = dir + Math.PI;
            const pushDist = 0.1 / (dist + 0.8);

            localPlayer.x += Math.cos(pushDir) * pushDist;
            localPlayer.y -= Math.sin(pushDir) * pushDist;
          }

          onPlayerDistanceChanged(player.identity, dist);
        });

        const [mappedX, mappedY] = mapWorldCoordToPixiCoord(
          localPlayer.x,
          localPlayer.y
        );
        playerGraphics[colyseusRoom.sessionId].x = mappedX;
        playerGraphics[colyseusRoom.sessionId].y = mappedY;

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

    colyseusRoom.state.players.onAdd = (player: any, sessionId: any) => {
      console.log('Colyseus player added', player);

      const graphic = new PIXI.Graphics();
      graphic.beginFill(player.color);
      graphic.drawCircle(0, 0, 16);
      graphic.endFill();
      pixiApp.stage.addChild(graphic);

      const [mappedX, mappedY] = mapWorldCoordToPixiCoord(player.x, player.y);
      graphic.x = mappedX;
      graphic.y = mappedY;

      playerGraphics[sessionId] = graphic;

      onPlayerAudioEnabledChanged(player.identity, player.audioEnabled);

      if (sessionId === colyseusRoom.sessionId) {
        console.log('Got initial local player state', player);
        localPlayerRef.current = {
          x: player.x,
          y: player.y,
          dir: player.dir,
          speed: player.speed,
        };
      } else {
        player.onChange = (changes: Colyseus.DataChange[]) => {
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

          if (
            changes.find((c) => (c as any).field === 'audioEnabled') != null
          ) {
            onPlayerAudioEnabledChanged(player.identity, player.audioEnabled);
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

  React.useEffect(() => {
    const updateDevices = () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setMediaDevices(devices);
      });
    };

    updateDevices();

    navigator.mediaDevices.ondevicechange = updateDevices;
  }, []);

  return (
    <S.Wrapper className={className} ref={wrapperRef} small={small}>
      <S.IconButtons>
        <S.IconButton
          name={localAudioInputEnabled ? 'mic' : 'mic_off'}
          disabled={!localAudioInputEnabled}
          forceDisplay={recentlyLoud}
          onClick={() => {
            if (localAudioInputEnabled) {
              disableLocalAudioInput();
            } else {
              enableLocalAudioInput();
            }
          }}
        />
        {localAudioInputEnabled && (
          <S.MicVolumeOverlayWrapper
            style={{ height: 6 + volume * 100 }}
            forceDisplay={recentlyLoud}
          >
            <S.MicVolumeOverlay name="mic"></S.MicVolumeOverlay>
          </S.MicVolumeOverlayWrapper>
        )}
        {!small && (
          <S.CaretButtonWrapper>
            <S.CaretButton />
            <select
              onChange={(e) => {
                const { value } = e.target;
                console.log('Microphone CHANGED');
                setLocalAudioInputDeviceId(value);
              }}
              value={localAudioInputDeviceId}
            >
              {mediaDevices
                .filter((device) => device.kind === 'audioinput')
                .map((device) => {
                  return (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  );
                })}
            </select>
          </S.CaretButtonWrapper>
        )}
        <S.IconButton
          name={localVideoInputEnabled ? 'videocam' : 'videocam_off'}
          disabled={!localVideoInputEnabled}
          onClick={() => {
            if (localVideoInputEnabled) {
              disableLocalVideoInput();
            } else {
              enableLocalVideoInput();
            }
          }}
        />
        {!small && (
          <S.CaretButtonWrapper>
            <S.CaretButton />
            <select
              onChange={(e) => {
                const { value } = e.target;
                setLocalVideoInputDeviceId(value);
              }}
              value={localVideoInputDeviceId}
            >
              {mediaDevices
                .filter((device) => device.kind === 'videoinput')
                .map((device) => {
                  return (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  );
                })}
            </select>
          </S.CaretButtonWrapper>
        )}
        <S.IconButton
          name={localAudioOutputEnabled ? 'volume_up' : 'volume_off'}
          disabled={!localAudioOutputEnabled}
          onClick={() => {
            setLocalAudioOutputEnabled(!localAudioOutputEnabled);
          }}
        />
        {!small && (
          <S.CaretButtonWrapper>
            <S.CaretButton />
            <select
              onChange={(e) => {
                const { value } = e.target;
                setLocalAudioOutputDeviceId(value);
              }}
              value={localAudioOutputDeviceId}
            >
              {mediaDevices
                .filter((device) => device.kind === 'audiooutput')
                .map((device) => {
                  return (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  );
                })}
            </select>
          </S.CaretButtonWrapper>
        )}
        <S.ScreenShareButton
          name={localScreenShareEnabled ? 'stop_screen_share' : 'screen_share'}
          active={localScreenShareEnabled}
          onClick={() => {
            if (localScreenShareEnabled) {
              stopScreenShare();
              return;
            }
            setScreenSharePickerOpen((o) => !o);
          }}
        />
      </S.IconButtons>
      <ScreenSharePicker
        open={screenSharePickerOpen}
        onClose={() => {
          setScreenSharePickerOpen(false);
        }}
        onStart={(id) => {
          console.log('Started sharing screen', id);
          setScreenSharePickerOpen(false);
          screenShare(id);
        }}
      ></ScreenSharePicker>
    </S.Wrapper>
  );
};

export default MapPanel;
