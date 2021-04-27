import * as S from './ChatFeed.styles';
import React from 'react';
import { useImmer } from 'use-immer';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import ChatMessage from './ChatMessage';

export interface ChatFeedProps {
  className?: string;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className }) => {
  const [feed, setFeed] = useImmer<any[]>([]);

  const { room } = React.useContext(ColyseusContext);

  React.useEffect(() => {
    room?.onMessage('chatMessage', (message) => {
      if (message == null) {
        return;
      }
      console.log('message', message);
      setFeed((draft) => {
        draft.push(message);
      });
    });
  }, [room]);

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
