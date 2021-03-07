import React from 'react';
import { v4 as uuid } from 'uuid';

interface LocalInfoContextValue {
  localIdentity: string;
  name: string;
  setName(name: string): void;
  localGhost: boolean;
  setLocalGhost(ghost: boolean): void;
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

  const [localGhost, setLocalGhost] = React.useState(true);

  const [name, setName] = React.useState('');

  return (
    <LocalInfoContext.Provider
      value={{ localIdentity, localGhost, setLocalGhost, name, setName }}
    >
      {children}
    </LocalInfoContext.Provider>
  );
};
