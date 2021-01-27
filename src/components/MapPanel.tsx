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

  const [roomState, setRoomState] = React.useState<any>(colyseusRoom.state);
  const [ticks, setTicks] = React.useState(0);

  console.log('state changed', roomState);

  const {
    width = window.innerWidth,
    height = window.innerWidth,
  } = useResizeObserver({
    ref: wrapperRef,
  });

  const pixiApp = React.useMemo(() => {
    const app = new PIXI.Application({
      width,
      height,
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

  const playerGraphics: {
    [sessionId: string]: PIXI.Graphics;
  } = React.useMemo(() => ({}), []);

  const scale = React.useMemo(() => {
    return minimized ? 0.5 : 1;
  }, [minimized]);

  const centerCamera = React.useCallback(() => {
    const player = colyseusRoom.state.players.get(colyseusRoom.sessionId);

    if (player != null) {
      pixiApp.stage.scale.x = scale;
      pixiApp.stage.scale.y = scale;
      pixiApp.stage.position.x = -player.x * scale + width / 2;
      pixiApp.stage.position.y = -player.y * scale + height / 2;
    }
  }, [colyseusRoom, pixiApp, width, height, scale]);

  React.useEffect(() => {
    pixiApp.renderer.resize(width, height);
    centerCamera();
  }, [width, height]);

  React.useEffect(() => {
    console.log('attaching global listener...');
    colyseusRoom.onStateChange((s) => {
      setRoomState(s);
      setTicks((t) => t + 1);
    });
    return () => {
      colyseusRoom.removeAllListeners();
    };
  }, [colyseusRoom]);

  const { players } = roomState;

  React.useEffect(() => {
    players.onAdd = (player: any, sessionId: any) => {
      console.log('Colyseus player added', player);

      const graphic = new PIXI.Graphics();
      graphic.beginFill(0xffffff);
      graphic.drawCircle(0, 0, 16);
      graphic.endFill();
      pixiApp.stage.addChild(graphic);

      graphic.x = player.x;
      graphic.y = player.y;

      playerGraphics[sessionId] = graphic;
    };

    players.onRemove = (player: any, sessionId: any) => {
      console.log('Colyseus player removed', player);
      pixiApp?.stage.removeChild(playerGraphics[sessionId]);
      delete playerGraphics[sessionId];
    };
  }, [players, pixiApp, centerCamera]);

  React.useEffect(() => {
    players.forEach((player: any, sessionId: any) => {
      const graphic = playerGraphics[sessionId];

      player.onChange = () => {
        graphic.x = player.x;
        graphic.y = player.y;

        console.log('player changed', player);

        if (sessionId === colyseusRoom.sessionId) {
          centerCamera();
        }
      };
    });
  }, [players, pixiApp, centerCamera]);

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
