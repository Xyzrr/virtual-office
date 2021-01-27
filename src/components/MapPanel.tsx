import * as S from './MapPanel.styles';
import React from 'react';
import * as PIXI from 'pixi.js';
import { app } from 'electron';
import * as Colyseus from 'colyseus.js';
import useResizeObserver from 'use-resize-observer';
import * as _ from 'lodash';

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

  React.useEffect(() => {
    scaleRef.current = minimized ? 0.5 : 1;
  }, [minimized]);

  const centerCamera = React.useCallback(() => {
    const player = colyseusRoom.state.players.get(colyseusRoom.sessionId);

    if (player != null) {
      pixiApp.stage.scale.x = scaleRef.current;
      pixiApp.stage.scale.y = scaleRef.current;
      pixiApp.stage.position.x =
        -player.x * scaleRef.current + windowSize.current.width / 2;
      pixiApp.stage.position.y =
        -player.y * scaleRef.current + windowSize.current.height / 2;
    }
  }, [colyseusRoom, pixiApp]);

  useResizeObserver({
    ref: wrapperRef,
    onResize(size) {
      if (size.width != null && size.height != null) {
        windowSize.current = { width: size.width, height: size.height };
        centerCamera();
        pixiApp.renderer.resize(size.width, size.height);
      }
    },
  });

  React.useEffect(() => {
    const playerGraphics: {
      [sessionId: string]: PIXI.Graphics;
    } = {};

    colyseusRoom.state.players.onAdd = (player: any, sessionId: any) => {
      console.log('Colyseus player added', player);

      const graphic = new PIXI.Graphics();
      graphic.beginFill(0xffffff);
      graphic.drawCircle(0, 0, 16);
      graphic.endFill();
      pixiApp.stage.addChild(graphic);

      graphic.x = player.x;
      graphic.y = player.y;

      playerGraphics[sessionId] = graphic;

      player.onChange = () => {
        graphic.x = player.x;
        graphic.y = player.y;

        console.log('Player changed', player);

        if (sessionId === colyseusRoom.sessionId) {
          centerCamera();
        }
      };
    };

    colyseusRoom.state.players.onRemove = (player: any, sessionId: any) => {
      console.log('Colyseus player removed', player);
      pixiApp?.stage.removeChild(playerGraphics[sessionId]);
      delete playerGraphics[sessionId];
    };
  }, [colyseusRoom, pixiApp, centerCamera]);

  React.useEffect(() => {
    wrapperRef.current?.appendChild(pixiApp.view);

    return () => {
      wrapperRef.current?.removeChild(pixiApp.view);
      pixiApp.destroy();
    };
  }, [pixiApp]);

  return <S.Wrapper className={className} ref={wrapperRef} />;
};

export default MapPanel;
