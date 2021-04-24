import { ipcRenderer } from 'electron/renderer';
import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import App from './App';
import AppWithContexts from './AppWithContexts';
import Auth from './Auth';
import { FirebaseContextProvider } from './contexts/FirebaseContext';
import GlobalStyles from './global.styles';
import Home from './Home';

const Routes: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <FirebaseContextProvider>
        <Router>
          <Switch>
            <Route path="/s/:spaceId" component={AppWithContexts} />
            <Route path="/home" component={Home} />
            <Route path="/" component={Auth} />
          </Switch>
        </Router>
      </FirebaseContextProvider>
    </>
  );
};

export default Routes;
