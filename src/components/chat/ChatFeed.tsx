import * as S from './ChatFeed.styles';
import React from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { v4 as uuid } from 'uuid';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import useFeed from './hooks/useFeed';

export interface ChatFeedProps {
  className?: string;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className }) => {
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(
    null
  );
  const { room } = React.useContext(ColyseusContext);
  const feed = useFeed();

  if (!room) {
    return null;
  }

  const chatInput = (
    <ChatInput
      key="chat-input"
      noHide={true}
      currentMessageId={currentMessageId}
      onStart={() => {
        console.log('SENDING START MESSAGE');
        const newId = uuid();
        setCurrentMessageId(newId);

        room.send('startMessage', {
          id: newId,
          sentAt: Date.now(),
          blocks: [
            {
              type: 'paragraph',
              children: [{ text: '' }],
            },
          ],
        });
      }}
      onSend={() => {
        setCurrentMessageId(null);
        // room.send('chatMessage', { blocks: value, sentAt: Date.now() });
      }}
    ></ChatInput>
  );

  const currentMessageIndex = feed.findIndex((m) => m.id === currentMessageId);

  const messageElements = feed.map((message, i) => {
    if (i === currentMessageIndex) {
      return chatInput;
    }

    let mergeWithAbove =
      i > 0 &&
      message.senderIdentity === feed[i - 1].senderIdentity &&
      message.sentAt - feed[i - 1].sentAt < 60 * 1000;

    return (
      <ChatMessage
        key={message.sentAt}
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
