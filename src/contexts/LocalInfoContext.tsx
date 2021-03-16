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
      }}
    >
      {children}
    </LocalInfoContext.Provider>
  );
};
