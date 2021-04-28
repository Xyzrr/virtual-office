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

  return (
    <S.StyledEditable
      className={className}
      renderElement={renderElement}
      focused={focused}
      hide={mouseIsIdle && !focused && !noHide}
      placeholder="Type a realtime message..."
      // onMouseDown={() => {
      //   if (!messageStartedRef.current) {
      //     onStart();
      //   }
      //   messageStartedRef.current = true;
      // }}
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
  currentMessageId: string | null;
  onStart(): void;
  onSend(): void;
  onEmpty(): void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  className,
  noHide,
  currentMessageId,
  onStart,
  onSend,
  onEmpty,
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
      <ChatInputEditable
        className={className}
        noHide={noHide || currentMessageId != null}
        onStart={onStart}
        onSend={() => {
          Transforms.select(editor, Editor.start(editor, []));
          setValue([
            {
              type: 'paragraph',
              children: [{ text: '' }],
            },
          ]);
          onSend();
        }}
      />
    </Slate>
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
