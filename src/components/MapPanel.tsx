import * as S from './MapPanel.styles';
import React from 'react';
import * as PIXI from 'pixi.js';
import { app } from 'electron';
import * as Colyseus from 'colyseus.js';

export interface MapPanelProps {
  className?: string;
  colyseusRoom: Colyseus.Room;
}

const MapPanel: React.FC<MapPanelProps> = ({ className, colyseusRoom }) => {
  const pixiApp = React.useMemo(() => {
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

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

  const playerGraphics: { [sessionId: string]: PIXI.Graphics } = React.useMemo(
    () => ({}),
    []
  );

  React.useEffect(() => {
    colyseusRoom.state.players.onAdd = (player: any, sessionId: any) => {
      console.log('player added');

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

    console.log('state', colyseusRoom.state);

    colyseusRoom.state.players.onRemove = (player: any, sessionId: any) => {
      pixiApp?.stage.removeChild(playerGraphics[sessionId]);
      delete playerGraphics[sessionId];
    };

    return () => {
      colyseusRoom.leave();
    };
  }, []);

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    wrapperRef.current?.appendChild(pixiApp.view);

    return () => {
      pixiApp.destroy();
    };
  }, [pixiApp]);

  return <S.Wrapper className={className} ref={wrapperRef} />;
};

export default MapPanel;
