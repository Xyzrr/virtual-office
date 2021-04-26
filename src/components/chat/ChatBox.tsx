import * as S from './Chatbox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';
import ChatInput from './ChatInput';

export interface ChatboxProps {
  className?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ className }) => {
  return (
    <S.Wrapper className={className}>
      <ChatFeed></ChatFeed>
      <ChatInput></ChatInput>
    </S.Wrapper>
  );
};

export default Chatbox;
