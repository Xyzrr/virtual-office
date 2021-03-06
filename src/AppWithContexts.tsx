import React from 'react';
import { ColyseusContextProvider } from './contexts/ColyseusContext';
import { LocalMediaContextProvider } from './contexts/LocalMediaContext';
import App from './App';

export interface AppWithContextsProps {}

const AppWithContexts: React.FC<AppWithContextsProps> = () => {
  return (
    <ColyseusContextProvider>
      <LocalMediaContextProvider>
        <App></App>
      </LocalMediaContextProvider>
    </ColyseusContextProvider>
  );
};

export default AppWithContexts;
