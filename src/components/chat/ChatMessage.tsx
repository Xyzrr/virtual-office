import * as S from './ChatMessage.styles';
import React from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import { mergeWith } from 'lodash';
import { withLinks } from './slate-plugins/links';
import { createEditorWithPlugins, renderElement } from './slate-plugins/merge';

export interface ChatMessageProps {
  className?: string;
  message: any;
  mergeWithAbove?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  className,
  message,
  mergeWithAbove,
}) => {
  const editor = React.useMemo(() => createEditor(), []);
  const { room } = React.useContext(ColyseusContext);
  const player = room?.state.players.get(message.senderIdentity);
  const { name } = player;
  const readableDate = new Date(message.sentAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <S.Wrapper className={className} mergeWithAbove={mergeWithAbove}>
      {!mergeWithAbove && (
        <S.MessageSignature>
          <S.SenderName>{name}</S.SenderName>
          <S.SentAt>{readableDate}</S.SentAt>
        </S.MessageSignature>
      )}
      <Slate editor={editor} value={message.blocks} onChange={() => {}}>
        <S.Message readOnly renderElement={renderElement}></S.Message>
      </Slate>
      <div id={`container-${message.id}`} />
    </S.Wrapper>
  );
};

export default ChatMessage;
