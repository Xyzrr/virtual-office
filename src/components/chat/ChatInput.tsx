import * as S from './ChatInput.styles';
import React from 'react';
import { ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor, Editor, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import { renderElement } from './slate-plugins/merge';
import { CustomElement } from './slate-plugins/types';
import { withLinks } from './slate-plugins/links';
import { withRealtime } from './slate-plugins/realtime';
import { withHistory } from 'slate-history';
import { ChatContext } from '../../contexts/ChatContext';
import { Room } from 'colyseus.js';

export interface ChatInputProps {
  className?: string;
  onStart(): void;
  onSend(): void;
  onEmpty(): void;
  onEscape?(): void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  className,
  onStart,
  onSend,
  onEmpty,
  onEscape,
}) => {
  const { room } = React.useContext(ColyseusContext);

  const { currentMessageId, inputFocused, setInputFocused } = React.useContext(
    ChatContext
  );
  const currentMessageIdRef = React.useRef<string | null>(currentMessageId);
  currentMessageIdRef.current = currentMessageId;
  const roomRef = React.useRef<Room>();
  roomRef.current = room;

  const editor = React.useMemo(() => {
    return withRealtime(
      withLinks(withHistory(withReact(createEditor()))),
      roomRef,
      currentMessageIdRef
    );
  }, []);

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
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => {
        console.log('ON CHANGE! OPERATIONS:', editor.operations);
        if (currentMessageId == null) {
          if (Editor.string(editor, [])) {
            onStart();
          }
        } else {
          if (!Editor.string(editor, [])) {
            onEmpty();
          }
        }
        setValue(newValue as CustomElement[]);
      }}
    >
      <S.StyledEditable
        className={className}
        onFocus={() => {
          setInputFocused(true);
        }}
        onBlur={() => {
          setInputFocused(false);
        }}
        renderElement={renderElement}
        $focused={inputFocused}
        placeholder="Type a realtime message..."
        onKeyDown={(e) => {
          e.stopPropagation();

          if (e.key === 'Enter') {
            if (!e.shiftKey) {
              e.preventDefault();
              if (Editor.string(editor, [])) {
                Transforms.select(editor, Editor.start(editor, []));
                setValue([
                  {
                    type: 'paragraph',
                    children: [{ text: '' }],
                  },
                ]);
                onSend();
              }
            }
          }

          if (e.key === 'Escape') {
            e.preventDefault();
            ReactEditor.blur(editor);
            onEscape?.();
          }
        }}
      />
    </Slate>
  );
};

export default ChatInput;
