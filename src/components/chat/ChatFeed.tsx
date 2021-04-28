import * as S from './ChatFeed.styles';
import React from 'react';
import { useImmer } from 'use-immer';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor, Editor, Operation, Transforms } from 'slate';
import { ColyseusContext } from '../../contexts/ColyseusContext';
import ChatMessage from './ChatMessage';
import { createEditorWithPlugins } from './slate-plugins/merge';
import { withLinks } from './slate-plugins/links';

export interface ChatFeedProps {
  className?: string;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ className }) => {
  const [feed, setFeed] = useImmer<any[]>([]);

  const { room } = React.useContext(ColyseusContext);

  React.useEffect(() => {
    if (!room) {
      return;
    }

    const removeOnChatMessage = room.onMessage('chatMessage', (message) => {
      if (message == null) {
        return;
      }
      console.log('message', message);
      setFeed((draft) => {
        draft.push(message);
      });
    });

    const removeOnStartMessage = room.onMessage('startMessage', (message) => {
      console.log('starting message');
      setFeed((draft) => {
        draft.push(message);
      });
    });

    const removeOnMessageOperation = room.onMessage(
      'messageOperation',
      (operation) => {
        console.log('RECEIVED OPERATION', operation.operation);
        setFeed((draft) => {
          const toEdit = draft.find((m) => m.id === operation.messageId);
          const tempEditor = createEditor();
          tempEditor.normalizeNode = () => {};
          tempEditor.children = toEdit.blocks;
          tempEditor.apply(operation.operation);
          toEdit.blocks = tempEditor.children;
        });
      }
    );

    return () => {
      removeOnChatMessage();
      removeOnStartMessage();
      removeOnMessageOperation();
    };
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
