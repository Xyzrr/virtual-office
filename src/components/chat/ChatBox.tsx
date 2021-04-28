import * as S from './Chatbox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';
import ChatInput from './ChatInput';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';
import useFeed from './hooks/useFeed';

export interface ChatboxProps {
  className?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ className }) => {
  const [expanded, setExpanded] = React.useState(false);

  const feed = useFeed();

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
          <ChatFeed feed={feed}></ChatFeed>
        </S.ChatFeedInnerWrapper>
      </S.ChatFeedOuterWrapper>
      <ChatInput noHide={expanded} feed={feed}></ChatInput>
    </S.Wrapper>
  );
};

export default Chatbox;
