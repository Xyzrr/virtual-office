import React from 'react';

import * as Colyseus from 'colyseus.js';
import { LocalMediaContext } from './LocalMediaContext';
import { LocalInfoContext } from './LocalInfoContext';
import { COLYSEUS_CLIENT, HOST } from '../components/constants';
import { useParams } from 'react-router-dom';

interface PlayerAddedEvent {
  identity: string;
  player: any;
}

interface PlayerUpdatedEvent {
  identity: string;
  player: any;
  changes: any[];
}

interface PlayerRemovedEvent {
  identity: string;
  player: any;
}

interface ColyseusEventMap {
  'player-added': PlayerAddedEvent;
  'player-updated': PlayerUpdatedEvent;
  'player-removed': PlayerRemovedEvent;
}

export type ColyseusEvent =
  | 'player-added'
  | 'player-updated'
  | 'player-removed';

type ColyseusListener<T extends ColyseusEvent> = (
  ev: ColyseusEventMap[T]
) => void;

interface ColyseusContextValue {
  room?: Colyseus.Room;
  error: string | null;
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
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    localIdentity,
    localName,
    localWhisperingTo,
    localColor,
    localApp,
    appSharingOn,
  } = React.useContext(LocalInfoContext);

  const {
    localAudioInputOn,
    localVideoInputOn,
    localScreenShareOn,
  } = React.useContext(LocalMediaContext);

  const params = useParams() as any;

  const listeners = React.useRef<
    {
      [key in ColyseusEvent]?: Set<ColyseusListener<key>>;
    }
  >();

  const join = React.useCallback(async (roomName: string) => {
    const r: Colyseus.Room<any> = await COLYSEUS_CLIENT.joinOrCreate(roomName, {
      identity: localIdentity,
      name: localName,
      color: localColor,
      audioInputOn: localAudioInputOn,
      videoInputOn: localVideoInputOn,
      spaceId: params.spaceId,
    });
    setSessionId(r.sessionId);

    console.log('Joined or created Colyseus room:', r);

    setRoom(r);

    r.state.players.onAdd = (player: any, identity: string) => {
      console.log('Colyseus player added:', identity);

      const addListeners = listeners.current?.['player-added'];

      if (addListeners) {
        addListeners.forEach((l) => l({ identity, player }));
      }

      player.onChange = (changes: any[]) => {
        console.log('Colyseus player updated:', identity, changes);

        const updateListeners = listeners.current?.['player-updated'];

        if (updateListeners) {
          updateListeners.forEach((l) => l({ identity, player, changes }));
        }
      };
    };

    r.state.players.onRemove = (player: any, identity: string) => {
      console.log('Colyseus player removed:', identity);

      const removeListeners = listeners.current?.['player-removed'];

      if (removeListeners) {
        removeListeners.forEach((l) => l({ identity, player }));
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

  React.useEffect(() => {
    join('main');
  }, [join]);

  React.useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  React.useEffect(() => {
    if (!room || !sessionId) {
      return;
    }

    const onLeave = async (code: number) => {
      console.log('LEFT WITH CODE:', code, room.id, room.sessionId, room);
      setError(`Disconnected with code ${code}. Reconnecting...`);
      let newRoom: Colyseus.Room | undefined;
      try {
        newRoom = await COLYSEUS_CLIENT.reconnect(room.id, sessionId);
      } catch (e) {
        console.log('FAILED TO RECONNECT:', e);
        setError('Failed to reconnect. Please try again later.');
      }
      if (newRoom) {
        setRoom(newRoom);
        setError(null);
      }
    };

    room.onLeave(onLeave);

    return () => {
      room.onLeave.remove(onLeave);
    };
  }, [room, sessionId]);

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
    const set = listeners.current?.[type];

    if (set) {
      set.delete(listener as any);
    }
  }, []);

  React.useEffect(() => {
    room?.send('updatePlayer', { audioInputOn: localAudioInputOn });
  }, [localAudioInputOn]);

  React.useEffect(() => {
    room?.send('updatePlayer', { videoInputOn: localVideoInputOn });
  }, [localVideoInputOn]);

  React.useEffect(() => {
    room?.send('updatePlayer', { screenShareOn: localScreenShareOn });
  }, [localScreenShareOn]);

  React.useEffect(() => {
    room?.send('updatePlayer', { color: localColor });
  }, [localColor]);

  React.useEffect(() => {
    room?.send('updatePlayer', { name: localName });
  }, [localName]);

  React.useEffect(() => {
    room?.send('updatePlayer', { whisperingTo: localWhisperingTo });
  }, [localWhisperingTo]);

  React.useEffect(() => {
    if (appSharingOn) {
      room?.send('appInfo', { ...localApp });
    }
  }, [localApp, appSharingOn]);

  return (
    <ColyseusContext.Provider
      value={{ room, addListener, removeListener, join, leave, error }}
    >
      {children}
    </ColyseusContext.Provider>
  );
};
