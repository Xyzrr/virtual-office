import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import AppWithContexts from './AppWithContexts';
import { autoUpdater } from 'electron-updater';

const Routes: React.FC = () => {
  React.useEffect(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, []);

  return (
    <Router>
      <Switch>
        <Route path="/" component={AppWithContexts} />
      </Switch>
    </Router>
  );
};

export default Routes;
