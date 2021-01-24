import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 256,
  height: 256,
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

const player = new PIXI.Graphics();

player.beginFill(0xffffff);
player.drawCircle(0, 0, 50);
player.endFill();

app.stage.addChild(player);

app.ticker.add(() => {
  player.x += 1;
});

const Hello = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;

    if (container == null) {
      return undefined;
    }

    container.appendChild(app.view);

    return () => {
      container.removeChild(app.view);
      app.destroy();
    };
  }, []);

  const onResize = React.useCallback(() => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  }, []);

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  return <div ref={containerRef} />;
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
