import React from 'react';
import { ColyseusContextProvider } from './contexts/ColyseusContext';
import { LocalMediaContextProvider } from './contexts/LocalMediaContext';
import { CallObjectContextProvider } from './contexts/CallObjectContext';
import { LocalInfoContextProvider } from './contexts/LocalInfoContext';
import App from './App';

export interface AppWithContextsProps {}

const AppWithContexts: React.FC<AppWithContextsProps> = () => {
  return (
    <LocalInfoContextProvider>
      <LocalMediaContextProvider>
        <ColyseusContextProvider>
          <CallObjectContextProvider>
            <App></App>
          </CallObjectContextProvider>
        </ColyseusContextProvider>
      </LocalMediaContextProvider>
    </LocalInfoContextProvider>
  );
};

export default AppWithContexts;
