import * as S from './Chatbox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';
import { ChatBoxContext } from './contexts/ChatBoxContext';
import { useMouseIsIdle } from '../../util/useMouseIsIdle';

export interface ChatboxProps {
  className?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ className }) => {
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(
    null
  );
  const [expanded, setExpanded] = React.useState(false);
  const [inputFocused, setInputFocused] = React.useState(false);

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
    <ChatBoxContext.Provider
      value={{
        currentMessageId,
        setCurrentMessageId,
        expanded,
        setExpanded,
        inputFocused,
        setInputFocused,
      }}
    >
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
        hideInput={mouseIsIdle && !inputFocused && !expanded}
      >
        <S.ChatFeedInnerWrapper>
          <ChatFeed
            onEscape={() => {
              setExpanded(false);
            }}
          />
        </S.ChatFeedInnerWrapper>
      </S.Wrapper>
    </ChatBoxContext.Provider>
  );
};

export default Chatbox;
