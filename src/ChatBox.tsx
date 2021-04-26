import * as S from './Chatbox.styles';
import React from 'react';

export interface ChatboxProps {
  className?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ className }) => {
  return (
    <S.Wrapper className={className}>
      <S.ChatInput>Input shit here</S.ChatInput>
    </S.Wrapper>
  );
};

export default Chatbox;
