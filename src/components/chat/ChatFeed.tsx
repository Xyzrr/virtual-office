import * as S from './ChatFeed.styles';
import React from 'react';

export interface ChatFeedProps {
  className?: string;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className }) => {
  return <S.Wrapper className={className}></S.Wrapper>;
};

export default ChatFeed;
