import React from 'react';
import { v4 as uuid } from 'uuid';
import { AppInfo, useAppTracker } from '../util/app-tracker/useAppTracker';
import firebase from 'firebase';

interface LocalInfoContextValue {
  localIdentity: string;
  localName: string;
  setLocalName(name: string): void;
  localGhost: boolean;
  setLocalGhost(ghost: boolean): void;
  localWhisperingTo?: string;
  setLocalWhisperingTo(identity: string | undefined): void;
  localColor?: number;
  setLocalColor(color: number): void;
  appSharingOn?: boolean;
  setAppSharingOn(on: boolean): void;
  localApp?: AppInfo;
}

export const LocalInfoContext = React.createContext<LocalInfoContextValue>(
  null!
);

export const LocalInfoContextProvider: React.FC = ({ children }) => {
  const localIdentity = React.useMemo(() => {
    const result = firebase.auth().currentUser?.uid || 'ERROR';
    console.log('LOCAL IDENTITY', result);
    return result;
  }, []);

  const [localName, setLocalName] = React.useState('');
  const [localGhost, setLocalGhost] = React.useState(true);
  const [localWhisperingTo, setLocalWhisperingTo] = React.useState<string>();
  const [localColor, setLocalColor] = React.useState<number>();
  const [appSharingOn, setAppSharingOn] = React.useState<boolean>();
  const localApp = useAppTracker();

  return (
    <LocalInfoContext.Provider
      value={{
        localIdentity,
        localGhost,
        setLocalGhost,
        localName,
        setLocalName,
        localWhisperingTo,
        setLocalWhisperingTo,
        localColor,
        setLocalColor,
        appSharingOn,
        setAppSharingOn,
        localApp,
      }}
    >
      {children}
    </LocalInfoContext.Provider>
  );
};
