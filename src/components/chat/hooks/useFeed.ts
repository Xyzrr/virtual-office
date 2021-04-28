import React from 'react';
import { useImmer } from 'use-immer';
import { ColyseusContext } from '../../../contexts/ColyseusContext';
import { createEditor, Editor, Operation, Transforms } from 'slate';

const useFeed = () => {
  const [feed, setFeed] = useImmer<any[]>([]);

  const { room } = React.useContext(ColyseusContext);

  React.useEffect(() => {
    if (!room) {
      return;
    }

    const removeOnChatMessage = room.onMessage('chatMessage', (message) => {
      if (message == null) {
        return;
      }
      console.log('message', message);
      setFeed((draft) => {
        draft.push(message);
      });
    });

    const removeOnStartMessage = room.onMessage('startMessage', (message) => {
      console.log('starting message');
      setFeed((draft) => {
        draft.push(message);
      });
    });

    const removeOnMessageOperation = room.onMessage(
      'messageOperation',
      (operation) => {
        console.log('RECEIVED OPERATION', operation.operation);
        setFeed((draft) => {
          const toEdit = draft.find((m) => m.id === operation.messageId);
          const tempEditor = createEditor();
          tempEditor.normalizeNode = () => {};
          tempEditor.children = toEdit.blocks;
          tempEditor.apply(operation.operation);
          toEdit.blocks = tempEditor.children;
        });
      }
    );

    return () => {
      removeOnChatMessage();
      removeOnStartMessage();
      removeOnMessageOperation();
    };
  }, [room]);

  return feed;
};

export default useFeed;
