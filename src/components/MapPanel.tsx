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
}

const MapPanel: React.FC<MapPanelProps> = ({
  className,
  colyseusRoom,
  minimized,
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
  const localPlayerPosition = React.useRef({ x: 0, y: 0 });

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

    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 32; j++) {
        const dot = new PIXI.Graphics();

        dot.beginFill(0x444444);
        dot.drawCircle(i * 32, j * 32, 2);
        dot.endFill();

        app.stage.addChild(dot);
      }
    }

    return app;
  }, []);

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
        centerCameraAround(
          localPlayerPosition.current.x,
          localPlayerPosition.current.y
        );
      }
    },
  });

  React.useEffect(() => {
    const playerGraphics: {
      [sessionId: string]: PIXI.Graphics;
    } = {};

    const animate = (time: number) => {
      requestAnimationFrame(animate);
      TWEEN.update(time);
    };
    requestAnimationFrame(animate);

    colyseusRoom.state.players.onAdd = (player: any, sessionId: any) => {
      console.log('Colyseus player added', player);

      const graphic = new PIXI.Graphics();
      graphic.beginFill(0xffffff);
      graphic.drawCircle(0, 0, 16);
      graphic.endFill();
      pixiApp.stage.addChild(graphic);

      graphic.x = player.x;
      graphic.y = player.y;

      localPlayerPosition.current = { x: player.x, y: player.y };

      playerGraphics[sessionId] = graphic;

      player.onChange = () => {
        new TWEEN.Tween(graphic)
          .to({ x: player.x, y: player.y }, 100)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
            if (sessionId === colyseusRoom.sessionId) {
              localPlayerPosition.current = { x: graphic.x, y: graphic.y };
              centerCameraAround(graphic.x, graphic.y);
            }
          })
          .start();

        console.log('Player changed', player);
      };
    };

    colyseusRoom.state.players.onRemove = (player: any, sessionId: any) => {
      console.log('Colyseus player removed', player);
      pixiApp?.stage.removeChild(playerGraphics[sessionId]);
      delete playerGraphics[sessionId];
    };
  }, [colyseusRoom, pixiApp, centerCameraAround]);

  React.useEffect(() => {
    wrapperRef.current?.appendChild(pixiApp.view);

    return () => {
      wrapperRef.current?.removeChild(pixiApp.view);
      pixiApp.destroy();
    };
  }, [pixiApp]);

  return (
    <S.Wrapper className={className} ref={wrapperRef}>
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
