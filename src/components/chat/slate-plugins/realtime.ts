import { Room } from 'colyseus.js';
import { Node, Element, Editor, Transforms, Range, Text } from 'slate';

export const withRealtime = <T extends Editor>(
  editor: T,
  room: Room,
  messageIdRef: React.MutableRefObject<number>
) => {
  const { apply } = editor;

  editor.apply = (operation) => {
    if (operation.type !== 'set_selection') {
      console.log('SENDING OPERATION', operation);
      room.send('messageOperation', {
        messageId: messageIdRef.current,
        operation,
      });
    }
    apply(operation);
  };

  return editor;
};
