import React from 'react';
import * as electron from 'electron';
import isHotkey from 'is-hotkey';

export const useFakeMinimize = (opts?: {
  onSetMinimized?(minimized: boolean): void;
}) => {
  const { onSetMinimized } = opts || {};

  const [minimized, setMinimized] = React.useState(false);

  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    if (minimized) {
      electron.ipcRenderer.invoke('minimize');
      setMinimized(true);
      onSetMinimized?.(true);
    } else {
      electron.ipcRenderer.invoke('unminimize');
      setMinimized(false);
      onSetMinimized?.(false);
    }
  }, [minimized]);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (isHotkey('mod+m', e)) {
        e.preventDefault();

        setMinimized((m) => !m);
      }
    },
    [minimized]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  return [minimized, setMinimized] as const;
};
