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

    const removeOnMessageOperations = room.onMessage(
      'messageOperations',
      (operationsMessage) => {
        console.log('RECEIVED OPERATIONS', operationsMessage);
        setFeed((draft) => {
          const toEdit = draft.find(
            (m) => m.id === operationsMessage.messageId
          );
          const tempEditor = createEditor();
          tempEditor.normalizeNode = () => {};
          tempEditor.children = toEdit.blocks;
          operationsMessage.operations.forEach(tempEditor.apply);
          console.log('AFTER OPERATIONS', tempEditor.children);
          toEdit.blocks = tempEditor.children;
        });
      }
    );

    return () => {
      removeOnChatMessage();
      removeOnStartMessage();
      removeOnMessageOperations();
    };
  }, [room]);

  return feed;
};

export default useFeed;
