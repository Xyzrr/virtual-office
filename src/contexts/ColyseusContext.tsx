import React from 'react';

import * as Colyseus from 'colyseus.js';

interface ColyseusContextValue {
  room?: Colyseus.Room;
  addListener(type: ColyseusEvent, listener: Listener): void;
  removeListener(type: ColyseusEvent, listener: Listener): void;
  join(roomName: string): void;
}

export const ColyseusContext = React.createContext<ColyseusContextValue>(null!);

type Listener = (type: string) => void;

interface ColyseusContextProviderProps {
  identity: string;
}

type ColyseusEvent =
  | 'participant-added'
  | 'participant-updated'
  | 'particpant-removed';

export const ColyseusContextProvider: React.FC<ColyseusContextProviderProps> = ({
  identity,
}) => {
  const [room, setRoom] = React.useState<Colyseus.Room | undefined>();

  const listeners = React.useRef(new Map<ColyseusEvent, Set<Listener>>());

  const join = React.useCallback(
    async (roomName: string) => {
      let host: string;
      if (process.env.LOCAL) {
        host = 'localhost:5000';
      } else {
        host = 'virtual-office-server.herokuapp.com';
      }

      const client = new Colyseus.Client(`ws://${host}`);

      const room = await client.joinOrCreate(roomName, {
        identity,
      });

      console.log('Joined or created Colyseus room:', room);

      setRoom(room);
    },
    [identity]
  );

  const addListener = React.useCallback(
    (type: ColyseusEvent, listener: Listener) => {
      if (!listeners.current.has(type)) {
        listeners.current.set(type, new Set());
      }

      const set = listeners.current.get(type)!;

      set.add(listener);
    },
    []
  );

  const removeListener = React.useCallback(
    (type: ColyseusEvent, listener: Listener) => {
      const set = listeners.current.get(type)!;

      set.delete(listener);
    },
    []
  );

  return (
    <ColyseusContext.Provider
      value={{ room, addListener, removeListener, join }}
    ></ColyseusContext.Provider>
  );
};
