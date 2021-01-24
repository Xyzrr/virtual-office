import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import * as PIXI from 'pixi.js';

const app = new PIXI.Application();

const player = new PIXI.Graphics();
player.beginFill(0xffffff);
player.drawCircle(0, 0, 10);
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
