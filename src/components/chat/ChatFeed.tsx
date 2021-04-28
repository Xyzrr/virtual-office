import * as S from './ChatFeed.styles';
import React from 'react';
import ChatMessage from './ChatMessage';

export interface ChatFeedProps {
  className?: string;
  feed: any[];
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className, feed }) => {
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
      </S.InnerWrapper>
    </S.Wrapper>
  );
};

export default ChatFeed;
