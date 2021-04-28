import * as S from './ChatInput.styles';
import React from 'react';
import { ReactEditor, Slate, useFocused, useSlateStatic } from 'slate-react';
import { Editor, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';
import { createEditorWithPlugins, renderElement } from './slate-plugins/merge';
import { CustomElement } from './slate-plugins/types';

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
  const editor = useSlateStatic();

  const mouseIsIdle = useMouseIsIdle();

  return (
    <S.StyledEditable
      renderElement={renderElement}
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
  const editor = React.useMemo(() => createEditorWithPlugins(), []);
  const [value, setValue] = React.useState<CustomElement[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  const { room } = React.useContext(ColyseusContext);
  if (!room) {
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
