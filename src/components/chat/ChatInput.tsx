import * as S from './ChatInput.styles';
import React from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor, Descendant, Editor, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';

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
        <Editable
          placeholder="Send a message..."
          onKeyDown={(e) => {
            e.stopPropagation();

            if (e.key === 'Enter') {
              e.preventDefault();
              room.send('chatMessage', { blocks: value, sentAt: Date.now() });
              Transforms.select(editor, Editor.start(editor, []));
              setValue([
                {
                  type: 'paragraph',
                  children: [{ text: '' }],
                },
              ]);
            }
          }}
        ></Editable>
      </Slate>
    </S.Wrapper>
  );
};

export default ChatInput;
