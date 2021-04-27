import * as S from './ChatInput.styles';
import React from 'react';
import {
  Editable,
  ReactEditor,
  Slate,
  useEditor,
  useFocused,
  useSlateStatic,
  withReact,
} from 'slate-react';
import { createEditor, Descendant, Editor, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';

export interface ChatInputEditableProps {
  className?: string;
  onSend(): void;
}

export const ChatInputEditable: React.FC<ChatInputEditableProps> = ({
  className,
  onSend,
}) => {
  const focused = useFocused();
  const editor = useSlateStatic() as ReactEditor;

  return (
    <S.StyledEditable
      focused={focused}
      placeholder="Send a message..."
      onKeyDown={(e) => {
        e.stopPropagation();

        if (e.key === 'Enter') {
          e.preventDefault();
          onSend();
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
}

const ChatInput: React.FC<ChatInputProps> = ({ className }) => {
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
