import * as S from './ChatInput.styles';
import React from 'react';
import {
  Editable,
  ReactEditor,
  Slate,
  useFocused,
  useSlateStatic,
  withReact,
} from 'slate-react';
import { createEditor, Descendant, Editor, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';

export interface ChatInputEditableProps {
  className?: string;
  noHide?: boolean;
  onSend(): void;
}

export const ChatInputEditable: React.FC<ChatInputEditableProps> = ({
  className,
  noHide,
  onSend,
}) => {
  const focused = useFocused();
  const editor = useSlateStatic() as ReactEditor;

  const mouseIsIdle = useMouseIsIdle();

  return (
    <S.StyledEditable
      focused={focused}
      hide={mouseIsIdle && !focused && !noHide}
      placeholder="Send a message..."
      onKeyDown={(e) => {
        e.stopPropagation();

        if (e.key === 'Enter') {
          if (!e.shiftKey) {
            e.preventDefault();
            if (Editor.string(editor, [])) {
              onSend();
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
}

const ChatInput: React.FC<ChatInputProps> = ({ className, noHide }) => {
  const editor = React.useMemo(
    () => withReact(createEditor() as ReactEditor),
    []
  );
  const [value, setValue] = React.useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ] as Descendant[]);

  const { room } = React.useContext(ColyseusContext);
  if (!room) {
    return null;
  }

  return (
    <S.Wrapper className={className}>
      <Slate
        editor={editor}
        value={value}
        onChange={(newValue) => setValue(newValue)}
      >
        <ChatInputEditable
          noHide={noHide}
          onSend={() => {
            room.send('chatMessage', { blocks: value, sentAt: Date.now() });
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

export default ChatInput;
