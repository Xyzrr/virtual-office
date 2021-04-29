import * as S from './Chatbox.styles';
import React from 'react';
import ChatFeed from './ChatFeed';

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
        setExpanded(true);
      }}
      onWheel={() => {
        setExpanded(true);
      }}
    >
      <S.ChatFeedInnerWrapper>
        <ChatFeed expanded={expanded} />
      </S.ChatFeedInnerWrapper>
    </S.Wrapper>
  );
};

export default Chatbox;
