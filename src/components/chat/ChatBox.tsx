import * as S from './Chatbox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';
import { ChatBoxContext } from '../../contexts/ChatBoxContext';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';

export interface ChatboxProps {
  className?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ className }) => {
  const {
    expanded,
    setExpanded,
    inputFocused,
    currentMessageId,
  } = React.useContext(ChatBoxContext);

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

export default Chatbox;
