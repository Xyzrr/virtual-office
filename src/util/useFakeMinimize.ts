import React from 'react';
import * as electron from 'electron';

export const useFakeMinimize = () => {
  const [minimized, setMinimized] = React.useState(false);
  const previousBounds = React.useRef<electron.Rectangle | undefined>();

  const onKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'm' && e.metaKey) {
      e.preventDefault();
      const win = electron.remote.getCurrentWindow();

      if (e.shiftKey) {
        if (previousBounds.current != null) {
          win.setBounds(previousBounds.current, true);
        } else {
          win.setBounds({ width: 640, height: 480 }, true);
        }
        win.setClosable(true);
        win.setMinimizable(true);
        win.setMaximizable(true);
        setMinimized(false);
        window.setTimeout(() => {
          win.shadow = true;
        }, 500);
        window.setTimeout(() => {
          win.shadow = true;
        }, 1000);
      } else {
        previousBounds.current = win.getBounds();
        win.setBounds({ x: 8, y: 24 }, true);
        win.setClosable(false);
        win.setMinimizable(false);
        win.setMaximizable(false);
        setMinimized(true);
        win.shadow = false;
      }
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  return minimized;
};
