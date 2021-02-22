import React from 'react';

export const useMouseIsIdle = (opts?: { minDuration?: number }) => {
  const { minDuration = 2000 } = opts || {};

  const lastMouseMoveTimerRef = React.useRef<number | null>(null);
  const [mouseIsIdle, setMouseIsIdle] = React.useState(false);

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setMouseIsIdle(false);
      if (lastMouseMoveTimerRef.current != null) {
        window.clearTimeout(lastMouseMoveTimerRef.current);
      }
      lastMouseMoveTimerRef.current = window.setTimeout(() => {
        setMouseIsIdle(true);
      }, minDuration);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      setMouseIsIdle(true);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return mouseIsIdle;
};
