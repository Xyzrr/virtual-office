import React from 'react';
import { ColyseusContextProvider } from './contexts/ColyseusContext';
import { LocalMediaContextProvider } from './contexts/LocalMediaContext';
import { CallObjectContextProvider } from './contexts/CallObjectContext';
import App from './App';

export interface AppWithContextsProps {}

const AppWithContexts: React.FC<AppWithContextsProps> = () => {
  return (
    <ColyseusContextProvider>
      <LocalMediaContextProvider>
        <CallObjectContextProvider>
          <App></App>
        </CallObjectContextProvider>
      </LocalMediaContextProvider>
    </ColyseusContextProvider>
  );
};

export default AppWithContexts;
