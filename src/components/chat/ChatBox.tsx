import * as S from './Chatbox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';
import ChatInput from './ChatInput';

export interface ChatboxProps {
  className?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ className }) => {
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const onMouseDown = () => {
      setExpanded(false);
    };

    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  return (
    <S.Wrapper
      className={className}
      expanded={expanded}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <S.ChatFeedOuterWrapper
        onWheel={() => {
          setExpanded(true);
        }}
      >
        <S.ChatFeedInnerWrapper>
          <ChatFeed></ChatFeed>
        </S.ChatFeedInnerWrapper>
      </S.ChatFeedOuterWrapper>
      <ChatInput></ChatInput>
    </S.Wrapper>
  );
};

export default Chatbox;
