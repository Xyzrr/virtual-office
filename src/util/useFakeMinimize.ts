import React from 'react';
import * as electron from 'electron';

export const useFakeMinimize = (minimizedHeight: number) => {
  const [minimized, setMinimized] = React.useState(false);
  const previousBounds = React.useRef<electron.Rectangle | undefined>();

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'm' && e.metaKey) {
        e.preventDefault();
        const win = electron.remote.getCurrentWindow();

        if (e.shiftKey) {
          if (previousBounds.current != null) {
            win.setBounds(previousBounds.current);
          } else {
            win.setBounds({ width: 640, height: 480 });
          }
          win.setWindowButtonVisibility(true);
          setMinimized(false);
        } else {
          previousBounds.current = win.getBounds();
          win.setBounds({
            x: 8,
            y: 24,
            width: 240 + 16,
            height: minimizedHeight,
          });
          win.setWindowButtonVisibility(false);
          setMinimized(true);
          win.shadow = false;
        }
      }
    },
    [minimizedHeight]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  return minimized;
};
