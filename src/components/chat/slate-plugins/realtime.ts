import { Room } from 'colyseus.js';
import { Node, Element, Editor, Transforms, Range, Text } from 'slate';

export const withRealtime = <T extends Editor>(
  editor: T,
  room: Room,
  messageIdRef: React.MutableRefObject<string | null>
) => {
  const { onChange } = editor;

  editor.onChange = (...args) => {
    const operations = editor.operations.filter(
      (o) => o.type !== 'set_selection'
    );
    if (operations.length === 0) {
      return onChange(...args);
    }

    if (messageIdRef.current == null) {
      throw new Error(
        'Attempted to send message operations with null message ID'
      );
    }

    room.send('messageOperations', {
      messageId: messageIdRef.current,
      operations: operations,
    });

    return onChange(...args);
  };

  return editor;
};
