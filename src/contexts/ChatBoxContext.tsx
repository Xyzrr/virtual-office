import React from 'react';
import useFeed from '../components/chat/hooks/useFeed';

interface ChatBoxContextValue {
  currentMessageId: string | null;
  setCurrentMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  inputFocused: boolean;
  setInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  feed: any[];
}

export const ChatBoxContext = React.createContext<ChatBoxContextValue>(null!);

export const ChatBoxContextProvider: React.FC = ({ children }) => {
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(
    null
  );
  const [expanded, setExpanded] = React.useState(false);
  const [inputFocused, setInputFocused] = React.useState(false);
  const feed = useFeed();

  return (
    <ChatBoxContext.Provider
      value={{
        currentMessageId,
        setCurrentMessageId,
        expanded,
        setExpanded,
        inputFocused,
        setInputFocused,
        feed,
      }}
    >
      {children}
    </ChatBoxContext.Provider>
  );
};
