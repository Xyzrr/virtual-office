import * as S from './ChatFeed.styles';
import React from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { v4 as uuid } from 'uuid';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import useFeed from './hooks/useFeed';
import { LocalInfoContext } from '../../contexts/LocalInfoContext';

export interface ChatFeedProps {
  className?: string;
  expanded?: boolean;
  onEscape?(): void;
}

const ChatFeed: React.FC<ChatFeedProps> = ({
  className,
  expanded,
  onEscape,
}) => {
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(
    null
  );
  const { room } = React.useContext(ColyseusContext);
  const { localIdentity } = React.useContext(LocalInfoContext);
  const feed = useFeed();

  if (!room) {
    return null;
  }

  console.log('MESSAGE ID', currentMessageId);

  const chatInput = (
    <ChatInput
      key="chat-input"
      noHide={expanded}
      currentMessageId={currentMessageId}
      onEmpty={() => {
        console.log('EMPTIED!');
        room.send('deleteMessage', { messageId: currentMessageId });
        setCurrentMessageId(null);
      }}
      onStart={() => {
        console.log('SENDING START MESSAGE');
        const newId = uuid();
        setCurrentMessageId(newId);

        room.send('startMessage', {
          id: newId,
          startedAt: Date.now(),
          blocks: [
            {
              type: 'paragraph',
              children: [{ text: '' }],
            },
          ],
        });
      }}
      onSend={() => {
        room.send('finishMessage', {
          messageId: currentMessageId,
          finishedAt: Date.now(),
        });
        setCurrentMessageId(null);
        // room.send('chatMessage', {id: uuid(), blocks: value, startedAt: Date.now(), finishedAt: Date.now() });
      }}
      onEscape={() => {
        if (currentMessageId == null) {
          onEscape();
        }
      }}
    ></ChatInput>
  );

  const currentMessageIndex = feed.findIndex((m) => m.id === currentMessageId);

  const messageElements = feed.map((message, i) => {
    if (i === currentMessageIndex) {
      return chatInput;
    }

    if (
      message.senderIdentity === localIdentity &&
      message.finishedAt == null
    ) {
      return null;
    }

    let mergeWithAbove =
      i > 0 &&
      message.senderIdentity === feed[i - 1].senderIdentity &&
      message.startedAt - feed[i - 1].finishedAt < 60 * 1000;

    return (
      <ChatMessage
        key={message.id}
        message={message}
        mergeWithAbove={mergeWithAbove}
      ></ChatMessage>
    );
  });

  if (currentMessageIndex === -1) {
    messageElements.push(chatInput);
  }

  return (
    <S.Wrapper className={className}>
      <S.InnerWrapper>{messageElements}</S.InnerWrapper>
    </S.Wrapper>
  );
};

export default ChatFeed;
