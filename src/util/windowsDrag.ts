import { ipcRenderer } from 'electron';
import React from 'react';

export const useWindowsDrag = () => {
  const mousePos = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onMouseUp = (e: MouseEvent) => {
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
  };

  const onMouseMove = () => {
    ipcRenderer.send('windowMoving', {
      mouseX: mousePos.current.x,
      mouseY: mousePos.current.y,
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
  };

  return { onMouseDown };
};
