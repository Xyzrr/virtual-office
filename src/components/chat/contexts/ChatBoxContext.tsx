import React from 'react';

interface ChatBoxContextValue {
  currentMessageId: string | null;
  setCurrentMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  inputFocused: boolean;
  setInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatBoxContext = React.createContext<ChatBoxContextValue>(null!);
