import * as S from './ChatFeed.styles';
import React from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { v4 as uuid } from 'uuid';
import { Transforms } from 'slate';
import { useSlateStatic } from 'slate-react';
import { ColyseusContext } from '../../contexts/ColyseusContext';

export interface ChatFeedProps {
  className?: string;
  feed: any[];
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className, feed }) => {
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(
    null
  );
  const { room } = React.useContext(ColyseusContext);
  if (!room) {
    return null;
  }

  return (
    <S.Wrapper className={className}>
      <S.InnerWrapper>
        {feed.map((message, i) => {
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
        })}
        <ChatInput
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
      </S.InnerWrapper>
    </S.Wrapper>
  );
};

export default ChatFeed;
