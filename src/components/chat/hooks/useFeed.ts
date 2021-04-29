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
      console.log('RECEIVED WHOLE MESSAGE', message);
      setFeed((draft) => {
        const insertIndex = draft.findIndex(
          (m) => m.startedAt > message.startedAt
        );
        if (insertIndex === -1) {
          draft.push(message);
        } else {
          // Just in case we received messages out of order.
          draft.splice(insertIndex, 0, message);
        }
      });
    });

    const removeOnStartMessage = room.onMessage('startMessage', (message) => {
      console.log('RECEIVED START MESSAGE', message);
      setFeed((draft) => {
        const insertIndex = draft.findIndex(
          (m) => m.startedAt > message.startedAt
        );
        if (insertIndex === -1) {
          draft.push(message);
        } else {
          // Just in case we received messages out of order.
          draft.splice(insertIndex, 0, message);
        }
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
          if (toEdit == null) {
            return;
          }
          const tempEditor = createEditor();
          tempEditor.normalizeNode = () => {};
          tempEditor.children = toEdit.blocks;
          operationsMessage.operations.forEach(tempEditor.apply);
          console.log('AFTER OPERATIONS', tempEditor.children);
          toEdit.blocks = tempEditor.children;
        });
      }
    );

    const removeOnFinishMessage = room.onMessage('finishMessage', (options) => {
      console.log('RECEIVED FINISHED MESSAGE', options);
      setFeed((draft) => {
        const message = draft.find((m) => m.id === options.messageId);
        if (!message) {
          return;
        }
        message.finishedAt = options.finishedAt;
      });
    });

    const removeOnDeleteMessage = room.onMessage('deleteMessage', (options) => {
      console.log('RECEIVED DELETE MESSAGE', options);
      setFeed((draft) => {
        const deleteIndex = draft.findIndex((m) => m.id === options.messageId);
        if (deleteIndex === -1) {
          return;
        }
        draft.splice(deleteIndex, 1);
      });
    });

    return () => {
      removeOnChatMessage();
      removeOnStartMessage();
      removeOnMessageOperations();
      removeOnFinishMessage();
      removeOnDeleteMessage();
    };
  }, [room]);

  return feed;
};

export default useFeed;
