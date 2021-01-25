import React from 'react';
import * as electron from 'electron';

export const useFakeMinimize = (minimizedHeight: number) => {
  const [minimized, setMinimized] = React.useState(false);
  const previousExpandedBounds = React.useRef<electron.Rectangle | undefined>();
  const previousMinimizedPosition = React.useRef<number[] | undefined>();

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'm' && e.metaKey) {
        e.preventDefault();
        const win = electron.remote.getCurrentWindow();

        if (e.shiftKey && minimized) {
          previousMinimizedPosition.current = win.getPosition();
          if (previousExpandedBounds.current != null) {
            win.setBounds(previousExpandedBounds.current);
          } else {
            win.setBounds({ width: 640, height: 480 });
          }
          win.setWindowButtonVisibility(true);
          win.setResizable(true);
          win.setAlwaysOnTop(false);
          window.setTimeout(() => {
            win.shadow = true;
          }, 200);
          setMinimized(false);
        }

        if (!e.shiftKey && !minimized) {
          previousExpandedBounds.current = win.getBounds();

          if (previousMinimizedPosition.current) {
            win.setBounds({
              x: previousMinimizedPosition.current[0],
              y: previousMinimizedPosition.current[1],
              width: 240 + 16,
              height: minimizedHeight,
            });
          } else {
            win.setBounds({
              x: 8,
              y: 24,
              width: 240 + 16,
              height: minimizedHeight,
            });
          }
          win.setWindowButtonVisibility(false);
          win.setResizable(false);
          win.setAlwaysOnTop(true);
          win.shadow = false;
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

    const win = electron.remote.getCurrentWindow();
    win.setBounds({
      width: 240 + 16,
      height: minimizedHeight,
    });
  }, [minimizedHeight, minimized]);

  return minimized;
};
