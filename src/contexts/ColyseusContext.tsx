import React from 'react';

import * as Colyseus from 'colyseus.js';

interface ColyseusContextValue {
  room?: Colyseus.Room;
  addListener(type: ColyseusEvent, listener: Listener): void;
  removeListener(type: ColyseusEvent, listener: Listener): void;
  join(roomName: string, identity: string): Promise<void>;
  leave(): void;
}

export const ColyseusContext = React.createContext<ColyseusContextValue>(null!);

type Listener = () => void;

interface ColyseusContextProviderProps {}

export type ColyseusEvent =
  | 'participant-added'
  | 'participant-updated'
  | 'participant-removed';

export const ColyseusContextProvider: React.FC<ColyseusContextProviderProps> = ({
  children,
}) => {
  const [room, setRoom] = React.useState<Colyseus.Room | undefined>();

  const listeners = React.useRef(new Map<ColyseusEvent, Set<Listener>>());

  const join = React.useCallback(async (roomName: string, identity: string) => {
    let host: string;
    if (process.env.LOCAL) {
      host = 'localhost:5000';
    } else {
      host = 'virtual-office-server.herokuapp.com';
    }

    const client = new Colyseus.Client(`ws://${host}`);

    const r: Colyseus.Room<any> = await client.joinOrCreate(roomName, {
      identity,
    });

    console.log('Joined or created Colyseus room:', r);

    setRoom(r);
  }, []);

  React.useEffect(() => {
    if (!room) {
      return;
    }

    room.state.players.onAdd = (player: any, identity: string) => {
      console.log('Colyseus player added:', identity);

      const addListeners = listeners.current.get('participant-added');

      if (addListeners) {
        addListeners.forEach((l) => l());
      }

      player.onChange = () => {
        const updateListeners = listeners.current.get('participant-updated');

        if (updateListeners) {
          updateListeners.forEach((l) => l());
        }
      };
    };

    room.state.players.onRemove = (player: any, identity: string) => {
      console.log('Colyseus player removed:', identity);

      const removeListeners = listeners.current.get('participant-removed');

      if (removeListeners) {
        removeListeners.forEach((l) => l());
      }
    };

    return () => {
      room.removeAllListeners();
    };
  }, [room]);

  const leave = React.useCallback(() => {
    if (!room) {
      return;
    }

    console.log('Leaving Colyseus room');

    room.leave();
  }, [room]);

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
      value={{ room, addListener, removeListener, join, leave }}
    >
      {children}
    </ColyseusContext.Provider>
  );
};
