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
  const [player, setPlayer] = React.useState<any | null>(
    () => room?.state.players.get(message.senderIdentity) || null
  );

  React.useEffect(() => {
    if (room == null) {
      return;
    }

    const p = room.state.players.get(message.senderIdentity);
    if (p != null) {
      setPlayer(p);
    }
  }, [room, message]);

  let readableDate: string;
  if (message.finishedAt) {
    readableDate = new Date(message.finishedAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } else {
    readableDate = '...';
  }

  return (
    <S.Wrapper className={className} mergeWithAbove={mergeWithAbove}>
      {!mergeWithAbove && (
        <S.MessageSignature>
          <S.SenderName>{player ? player.name : 'Unknown'}</S.SenderName>
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