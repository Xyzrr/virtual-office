import React from 'react';

import * as Colyseus from 'colyseus.js';
import { LocalMediaContext } from './LocalMediaContext';

interface ParticipantAddedEvent {
  identity: string;
  participant: any;
}

interface ParticipantUpdatedEvent {
  identity: string;
  participant: any;
  changes: Colyseus.DataChange[];
}

interface ParticipantRemovedEvent {
  identity: string;
  participant: any;
}

interface ColyseusEventMap {
  'participant-added': ParticipantAddedEvent;
  'participant-updated': ParticipantUpdatedEvent;
  'participant-removed': ParticipantRemovedEvent;
}

export type ColyseusEvent =
  | 'participant-added'
  | 'participant-updated'
  | 'participant-removed';

type ColyseusListener<T extends ColyseusEvent> = (
  ev: ColyseusEventMap[T]
) => void;

interface ColyseusContextValue {
  room?: Colyseus.Room;
  addListener<T extends ColyseusEvent>(
    type: T,
    listener: ColyseusListener<T>
  ): void;
  removeListener<T extends ColyseusEvent>(
    type: T,
    listener: ColyseusListener<T>
  ): void;
  join(roomName: string, identity: string): Promise<void>;
  leave(): void;
}

export const ColyseusContext = React.createContext<ColyseusContextValue>(null!);

interface ColyseusContextProviderProps {}

export const ColyseusContextProvider: React.FC<ColyseusContextProviderProps> = ({
  children,
}) => {
  const [room, setRoom] = React.useState<Colyseus.Room | undefined>();

  const {
    localAudioInputOn,
    localVideoInputOn,
    localScreenShareOn,
  } = React.useContext(LocalMediaContext);

  const listeners = React.useRef<
    {
      [key in ColyseusEvent]?: Set<ColyseusListener<key>>;
    }
  >();

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
      audioInputOn: localAudioInputOn,
      videoInputOn: localVideoInputOn,
    });

    console.log('Joined or created Colyseus room:', r);

    setRoom(r);

    r.state.participants.onAdd = (participant: any, identity: string) => {
      console.log('Colyseus participant added:', identity);

      const addListeners = listeners.current?.['participant-added'];

      if (addListeners) {
        addListeners.forEach((l) => l({ identity, participant }));
      }

      participant.onChange = (changes: Colyseus.DataChange[]) => {
        console.log('Colyseus participant updated:', identity, changes);

        const updateListeners = listeners.current?.['participant-updated'];

        if (updateListeners) {
          updateListeners.forEach((l) => l({ identity, participant, changes }));
        }
      };
    };

    r.state.participants.onRemove = (participant: any, identity: string) => {
      console.log('Colyseus participant removed:', identity);

      const removeListeners = listeners.current?.['participant-removed'];

      if (removeListeners) {
        removeListeners.forEach((l) => l({ identity, participant }));
      }
    };
  }, []);

  React.useEffect(() => {
    if (!room) {
      return;
    }

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

  const addListener = React.useCallback<ColyseusContextValue['addListener']>(
    (type, listener) => {
      if (!listeners.current) {
        listeners.current = {};
      }

      if (!listeners.current[type]) {
        (listeners.current as any)[type] = new Set();
      }

      const set = listeners.current[type]!;

      set.add(listener as any);
    },
    []
  );

  const removeListener = React.useCallback<
    ColyseusContextValue['removeListener']
  >((type, listener) => {
    const set = (listeners.current as any).get(type)!;

    set.delete(listener);
  }, []);

  React.useEffect(() => {
    room?.send('updateParticipant', { audioInputOn: localAudioInputOn });
  }, [localAudioInputOn]);

  React.useEffect(() => {
    room?.send('updateParticipant', { videoInputOn: localVideoInputOn });
  }, [localVideoInputOn]);

  React.useEffect(() => {
    room?.send('updateParticipant', { screenShareOn: localScreenShareOn });
  }, [localScreenShareOn]);

  return (
    <ColyseusContext.Provider
      value={{ room, addListener, removeListener, join, leave }}
    >
      {children}
    </ColyseusContext.Provider>
  );
};
