import React from 'react';
import * as electron from 'electron';

export const useFakeMinimize = (minimizedHeight: number) => {
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
          electron.ipcRenderer.invoke('minimize', minimizedHeight);
          setMinimized(true);
        }
      }
    },
    [minimizedHeight, minimized]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  React.useEffect(() => {
    if (!minimized) {
      return;
    }

    electron.ipcRenderer.invoke('updateMinimizedHeight', minimizedHeight);
  }, [minimizedHeight, minimized]);

  return minimized;
};
