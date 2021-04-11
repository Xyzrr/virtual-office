import React from 'react';
import { v4 as uuid } from 'uuid';

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
}

export const LocalInfoContext = React.createContext<LocalInfoContextValue>(
  null!
);

export const LocalInfoContextProvider: React.FC = ({ children }) => {
  const localIdentity = React.useMemo(() => {
    const result = `cool-person-${uuid()}`;
    console.log('Local identity:', result);
    return result;
  }, []);

  const [localName, setLocalName] = React.useState('');
  const [localGhost, setLocalGhost] = React.useState(true);
  const [localWhisperingTo, setLocalWhisperingTo] = React.useState<string>();
  const [localColor, setLocalColor] = React.useState<number>();
  const [appSharingOn, setAppSharingOn] = React.useState<boolean>();

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
      }}
    >
      {children}
    </LocalInfoContext.Provider>
  );
};
