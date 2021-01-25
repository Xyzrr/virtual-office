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
}

const MapPanel: React.FC<MapPanelProps> = ({ className, colyseusRoom }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const { width, height } = useResizeObserver({
    ref: wrapperRef,
  });

  const pixiApp = React.useMemo(() => {
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
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
    if (width == null || height == null) {
      return;
    }

    pixiApp.renderer.resize(width, height);
  }, [width, height]);

  const playerGraphics: { [sessionId: string]: PIXI.Graphics } = React.useMemo(
    () => ({}),
    []
  );

  React.useEffect(() => {
    colyseusRoom.state.players.onAdd = (player: any, sessionId: any) => {
      console.log('Colyseus player added', player);

      const graphic = new PIXI.Graphics();
      graphic.beginFill(0xffffff);
      graphic.drawCircle(player.x, player.y, 16);
      graphic.endFill();
      pixiApp?.stage.addChild(graphic);

      player.onChange = () => {
        graphic.x = player.x;
        graphic.y = player.y;
      };

      playerGraphics[sessionId] = graphic;
    };

    colyseusRoom.state.players.onRemove = (player: any, sessionId: any) => {
      console.log('Colyseus player removed', player);
      pixiApp?.stage.removeChild(playerGraphics[sessionId]);
      delete playerGraphics[sessionId];
    };
  }, [colyseusRoom]);

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
