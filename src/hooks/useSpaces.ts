import React from 'react';
import * as Colyseus from 'colyseus.js';
import { useImmer } from 'use-immer';
import { HOST } from '../components/constants';

const useSpaces = () => {
  const [spaces, setSpaces] = useImmer<Colyseus.RoomAvailable[] | null>(null);
  React.useEffect(() => {
    const client = new Colyseus.Client(`ws://${HOST}`);
    client.joinOrCreate('lobby').then((lobby) => {
      lobby.onMessage('rooms', (rooms) => {
        console.log('rooms');
        setSpaces(rooms);
      });

      lobby.onMessage('+', ([roomId, room]) => {
        setSpaces((draft) => {
          if (draft == null) {
            return;
          }
          const spaceIndex = draft.findIndex(
            (space) => space.roomId === roomId
          );
          if (spaceIndex === -1) {
            draft.push(room);
          } else {
            draft[spaceIndex] = room;
          }
        });
      });

      lobby.onMessage('-', (roomId) => {
        setSpaces((draft) => {
          if (draft == null) {
            return;
          }
          const spaceIndex = draft.findIndex(
            (space) => space.roomId === roomId
          );
          delete draft[spaceIndex];
        });
      });
    });
  }, []);

  return spaces;
};

export default useSpaces;
