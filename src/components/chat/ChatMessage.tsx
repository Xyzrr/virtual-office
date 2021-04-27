import * as S from './ChatMessage.styles';
import React from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';

export interface ChatMessageProps {
  className?: string;
  message: any;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ className, message }) => {
  const editor = React.useMemo(
    () => withReact(createEditor() as ReactEditor),
    []
  );
  const { room } = React.useContext(ColyseusContext);
  const player = room?.state.players.get(message.senderIdentity);
  const { name } = player;
  return (
    <S.Wrapper className={className}>
      <S.SenderName>{name}</S.SenderName>
      <Slate editor={editor} value={message.blocks} onChange={() => {}}>
        <Editable readOnly></Editable>
      </Slate>
    </S.Wrapper>
  );
};

export default ChatMessage;
