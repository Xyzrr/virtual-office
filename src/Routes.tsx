import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import AppWithContexts from './AppWithContexts';
import Auth from './Auth';
import GlobalStyles from './global.styles';

const Routes: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <Router>
        <Switch>
          <Route path="/" component={AppWithContexts} />
        </Switch>
      </Router>
    </>
  );
};

export default Routes;
