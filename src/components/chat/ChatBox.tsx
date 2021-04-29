import * as S from './ChatBox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';
import { ChatContext } from '../../contexts/ChatContext';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';

export interface ChatBoxProps {
  className?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ className }) => {
  const {
    expanded,
    setExpanded,
    inputFocused,
    currentMessageId,
  } = React.useContext(ChatContext);

  React.useEffect(() => {
    const onMouseDown = () => {
      setExpanded(false);
    };

    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const mouseIsIdle = useMouseIsIdle();

  return (
    <S.Wrapper
      className={className}
      expanded={expanded}
      onMouseDown={(e) => {
        e.stopPropagation();
        setExpanded(true);
      }}
      onWheel={() => {
        setExpanded(true);
      }}
      hideInput={
        mouseIsIdle && !inputFocused && !expanded && currentMessageId == null
      }
    >
      <S.ChatFeedInnerWrapper>
        <ChatFeed
          onEscape={() => {
            setExpanded(false);
          }}
        />
      </S.ChatFeedInnerWrapper>
    </S.Wrapper>
  );
};

export default ChatBox;
