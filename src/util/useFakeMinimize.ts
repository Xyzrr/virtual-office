import React from 'react';
import * as electron from 'electron';

export const useFakeMinimize = (opts?: {
  onSetMinimized?(minimized: boolean): void;
}) => {
  const { onSetMinimized } = opts || {};

  const [minimized, setMinimized] = React.useState(false);

  const minimize = React.useCallback(() => {
    electron.ipcRenderer.invoke('minimize');
    setMinimized(true);
    onSetMinimized?.(true);
  }, []);

  const unminimize = React.useCallback(() => {
    electron.ipcRenderer.invoke('unminimize');
    setMinimized(false);
    onSetMinimized?.(false);
  }, []);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'm' && e.metaKey) {
        e.preventDefault();

        if (!minimized) {
          minimize();
        }

        if (minimized) {
          unminimize();
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

  return [
    minimized,
    (min: boolean) => {
      if (min) {
        minimize();
      } else {
        unminimize();
      }
    },
  ] as const;
};
