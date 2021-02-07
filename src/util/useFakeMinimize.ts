import React from 'react';
import * as electron from 'electron';

export const useFakeMinimize = () => {
  const [minimized, setMinimized] = React.useState(false);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'm' && e.metaKey) {
        e.preventDefault();

        if (e.shiftKey && minimized) {
          electron.ipcRenderer.invoke('unminimize');
          setMinimized(false);
        }

        if (!e.shiftKey && !minimized) {
          electron.ipcRenderer.invoke('minimize');
          setMinimized(true);
        }
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

  return minimized;
};
