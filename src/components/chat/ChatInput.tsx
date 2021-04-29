import * as S from './ChatInput.styles';
import React from 'react';
import ReactDOM from 'react-dom';
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
import { withHistory } from 'slate-history';

export interface ChatInputProps {
  className?: string;
  noHide?: boolean;
  currentMessageId: string | null;
  onStart(): void;
  onSend(): void;
  onEmpty(): void;
  onEscape?(): void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  className,
  noHide,
  currentMessageId,
  onStart,
  onSend,
  onEmpty,
  onEscape,
}) => {
  const { room } = React.useContext(ColyseusContext);

  const currentMessageIdRef = React.useRef<string | null>(currentMessageId);
  currentMessageIdRef.current = currentMessageId;

  const editor = React.useMemo(() => {
    if (!room) {
      return null;
    }

    return withRealtime(
      withLinks(withHistory(withReact(createEditor()))),
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

  console.log('VALUE', JSON.parse(JSON.stringify(value)));
  const mouseIsIdle = useMouseIsIdle();
  const [focused, setFocused] = React.useState(false);

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
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        renderElement={renderElement}
        focused={focused}
        hide={mouseIsIdle && !focused && !noHide}
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
