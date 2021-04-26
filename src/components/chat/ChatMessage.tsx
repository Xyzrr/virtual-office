import * as S from './ChatMessage.styles';
import React from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor } from 'slate';

export interface ChatMessageProps {
  className?: string;
  message: any;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ className, message }) => {
  const editor = React.useMemo(
    () => withReact(createEditor() as ReactEditor),
    []
  );
  return (
    <S.Wrapper className={className}>
      <Slate editor={editor} value={message.blocks} onChange={() => {}}>
        <Editable readOnly></Editable>
      </Slate>
    </S.Wrapper>
  );
};

export default ChatMessage;
