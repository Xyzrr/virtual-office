import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import AppWithContexts from './AppWithContexts';

const Routes: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" component={AppWithContexts} />
      </Switch>
    </Router>
  );
};

export default Routes;
