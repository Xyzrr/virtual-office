import * as S from './ChatInput.styles';
import React from 'react';
import {
  ReactEditor,
  Slate,
  useFocused,
  useSlateStatic,
  withReact,
} from 'slate-react';
import { createEditor, Editor, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';
import { createEditorWithPlugins, renderElement } from './slate-plugins/merge';
import { CustomElement } from './slate-plugins/types';
import { Room } from 'colyseus.js';
import { withLinks } from './slate-plugins/links';
import { withRealtime } from './slate-plugins/realtime';

export interface ChatInputEditableProps {
  className?: string;
  noHide?: boolean;
  onStart(): void;
  onSend(): void;
}

export const ChatInputEditable: React.FC<ChatInputEditableProps> = ({
  className,
  noHide,
  onStart,
  onSend,
}) => {
  const focused = useFocused();
  const editor = useSlateStatic();

  const mouseIsIdle = useMouseIsIdle();

  const messageStartedRef = React.useRef(false);

  return (
    <S.StyledEditable
      renderElement={renderElement}
      focused={focused}
      hide={mouseIsIdle && !focused && !noHide}
      placeholder="Send a message..."
      onKeyDown={(e) => {
        e.stopPropagation();

        if (!messageStartedRef.current) {
          onStart();
        }
        messageStartedRef.current = true;

        if (e.key === 'Enter') {
          if (!e.shiftKey) {
            e.preventDefault();
            if (Editor.string(editor, [])) {
              onSend();
              messageStartedRef.current = false;
            }
          }
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          ReactEditor.blur(editor);
        }
      }}
    />
  );
};

export interface ChatInputProps {
  className?: string;
  noHide?: boolean;
  room: Room;
}

const ChatInput: React.FC<ChatInputProps> = ({ className, noHide }) => {
  const { room } = React.useContext(ColyseusContext);

  const currentMessageIdRef = React.useRef(Math.random());

  const editor = React.useMemo(() => {
    if (!room) {
      return null;
    }

    return withRealtime(
      withLinks(withReact(createEditor())),
      room,
      currentMessageIdRef
    );
  }, [room]);

  const [value, setValue] = React.useState<CustomElement[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  if (!room || !editor) {
    return null;
  }

  return (
    <S.Wrapper className={className}>
      <Slate
        editor={editor}
        value={value}
        onChange={(newValue) => setValue(newValue as CustomElement[])}
      >
        <ChatInputEditable
          noHide={noHide}
          onStart={() => {
            room.send('startMessage', {
              messageId: currentMessageIdRef.current,
              sentAt: Date.now(),
              blocks: [
                {
                  type: 'paragraph',
                  children: [{ text: '' }],
                },
              ],
            });
          }}
          onSend={() => {
            currentMessageIdRef.current = Math.random();
            // room.send('chatMessage', { blocks: value, sentAt: Date.now() });
            Transforms.select(editor, Editor.start(editor, []));
            setValue([
              {
                type: 'paragraph',
                children: [{ text: '' }],
              },
            ]);
          }}
        />
      </Slate>
    </S.Wrapper>
  );
};

// interface ChatInputProps {
//   className?: string;
// }

// const ChatInput: React.FC<ChatInputProps> = ({ className }) => {
//   const { room } = React.useContext(ColyseusContext);
//   if (!room) {
//     return null;
//   }

//   return <ChatInputReady className={className}></ChatInputReady>;
// };

export default ChatInput;
