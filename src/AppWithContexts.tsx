import React from 'react';
import { ColyseusContextProvider } from './contexts/ColyseusContext';
import App from './App';

export interface AppWithContextsProps {}

const AppWithContexts: React.FC<AppWithContextsProps> = () => {
  return (
    <ColyseusContextProvider>
      <App></App>
    </ColyseusContextProvider>
  );
};

export default AppWithContexts;
