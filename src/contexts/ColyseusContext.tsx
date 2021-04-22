import React from 'react';

import * as Colyseus from 'colyseus.js';
import { LocalMediaContext } from './LocalMediaContext';
import { LocalInfoContext } from './LocalInfoContext';
import { HOST } from '../components/constants';
import { useParams } from 'react-router-dom';

interface PlayerAddedEvent {
  identity: string;
  player: any;
}

interface PlayerUpdatedEvent {
  identity: string;
  player: any;
  changes: Colyseus.DataChange[];
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
    localIdentity,
    localName,
    localWhisperingTo,
    localColor,
    setLocalColor,
    localApp,
    appSharingOn,
  } = React.useContext(LocalInfoContext);

  const {
    localAudioInputOn,
    localVideoInputOn,
    localScreenShareOn,
  } = React.useContext(LocalMediaContext);

  const params = useParams();

  console.log('PARAMS', params);

  const listeners = React.useRef<
    {
      [key in ColyseusEvent]?: Set<ColyseusListener<key>>;
    }
  >();

  const join = React.useCallback(async (roomName: string, identity: string) => {
    const client = new Colyseus.Client(`ws://${HOST}`);

    const r: Colyseus.Room<any> = await client.joinOrCreate(roomName, {
      identity,
      audioInputOn: localAudioInputOn,
      videoInputOn: localVideoInputOn,
    });
    console.log('AVAIL ROOMS', await client.getAvailableRooms());

    console.log('Joined or created Colyseus room:', r);

    setRoom(r);

    r.state.players.onAdd = (player: any, identity: string) => {
      console.log('Colyseus player added:', identity);

      if (identity === localIdentity) {
        setLocalColor(player.color);
      }

      const addListeners = listeners.current?.['player-added'];

      if (addListeners) {
        addListeners.forEach((l) => l({ identity, player }));
      }

      player.onChange = (changes: Colyseus.DataChange[]) => {
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
      value={{ room, addListener, removeListener, join, leave }}
    >
      {children}
    </ColyseusContext.Provider>
  );
};
