import React from 'react';
import { ColyseusContextProvider } from './contexts/ColyseusContext';
import { LocalMediaContextProvider } from './contexts/LocalMediaContext';
import { DailyVideoCallContextProvider } from './contexts/VideoCallContext/DailyVideoCallContext';
import { LocalInfoContextProvider } from './contexts/LocalInfoContext';
import App from './App';

export interface AppWithContextsProps {}

const AppWithContexts: React.FC<AppWithContextsProps> = () => {
  return (
    <LocalInfoContextProvider>
      <LocalMediaContextProvider>
        <ColyseusContextProvider>
          <DailyVideoCallContextProvider>
            <App></App>
          </DailyVideoCallContextProvider>
        </ColyseusContextProvider>
      </LocalMediaContextProvider>
    </LocalInfoContextProvider>
  );
};

export default AppWithContexts;
