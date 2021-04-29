import React from 'react';
import { ColyseusContextProvider } from './contexts/ColyseusContext';
import { LocalMediaContextProvider } from './contexts/LocalMediaContext';
import { DailyVideoCallContextProvider } from './contexts/VideoCallContext/DailyVideoCallContext';
import { LocalInfoContextProvider } from './contexts/LocalInfoContext';
import { ChatContextProvider } from './contexts/ChatContext';
import App from './App';
import { useParams } from 'react-router-dom';

export interface AppWithContextsProps {}

const AppWithContexts: React.FC<AppWithContextsProps> = () => {
  // Remount component whenever spaceId changes
  const params = useParams() as any;

  return (
    <LocalInfoContextProvider>
      <LocalMediaContextProvider>
        <ColyseusContextProvider key={params.spaceId}>
          <DailyVideoCallContextProvider>
            <ChatContextProvider>
              <App></App>
            </ChatContextProvider>
          </DailyVideoCallContextProvider>
        </ColyseusContextProvider>
      </LocalMediaContextProvider>
    </LocalInfoContextProvider>
  );
};

export default AppWithContexts;
