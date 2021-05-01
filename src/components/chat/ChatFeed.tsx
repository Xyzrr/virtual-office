import * as S from './ChatFeed.styles';
import React from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { v4 as uuid } from 'uuid';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import { LocalInfoContext } from '../../contexts/LocalInfoContext';
import { ChatContext } from '../../contexts/ChatContext';

export interface ChatFeedProps {
  className?: string;
  onEscape?(): void;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className, onEscape }) => {
  const { currentMessageId, setCurrentMessageId, feed } = React.useContext(
    ChatContext
  );
  const { room } = React.useContext(ColyseusContext);
  const { localIdentity } = React.useContext(LocalInfoContext);
  const [lastSentMessageId, setLastSentMessageId] = React.useState<
    string | null
  >(null);

  if (!room) {
    return null;
  }

  const chatInput = (
    <ChatInput
      key="chat-input"
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
        setLastSentMessageId(currentMessageId);
        setCurrentMessageId(null);
        // room.send('chatMessage', {id: uuid(), blocks: value, startedAt: Date.now(), finishedAt: Date.now() });
      }}
      onEscape={() => {
        if (currentMessageId == null) {
          onEscape?.();
        }
      }}
    ></ChatInput>
  );

  const currentMessageIndex = feed.findIndex((m) => m.id === currentMessageId);

  const messageElements = feed.map((message, i) => {
    if (i === currentMessageIndex) {
      return chatInput;
    }

    let pending = false;
    if (
      message.senderIdentity === localIdentity &&
      message.finishedAt == null
    ) {
      if (lastSentMessageId === message.id) {
        // This message was just finished, and the server hasn't yet acknowledged it.
        pending = true;
      } else {
        // This message was just deleted, and the server hasn't yet acknowledged it.
        return null;
      }
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
        pending={pending}
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
