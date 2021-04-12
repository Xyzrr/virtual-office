import * as S from './Popup.styles';
import React from 'react';
import useResizeObserver from 'use-resize-observer';
import NewWindow from './NewWindow';
import { ipcRenderer } from 'electron';

export type Origin =
  | 'top left'
  | 'top center'
  | 'top right'
  | 'center left'
  | 'center right'
  | 'bottom left'
  | 'bottom center'
  | 'bottom right';

export interface PopupProps {
  className?: string;
  x: number;
  y: number;
  origin?: Origin;
}

const Popup: React.FC<PopupProps> = ({
  className,
  x,
  y,
  origin = 'bottom center',
  children,
}) => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  React.useEffect(() => {
    if (width == null || height == null) {
      return;
    }

    ipcRenderer.send('showPopup', {
      x,
      y,
      width,
      height,
    });

    console.log('showing popup', {
      x,
      y,
      width,
      height,
    });
  }, [width, height]);

  console.log('popup render');

  return (
    <NewWindow name="popup" open={true}>
      <S.Wrapper ref={ref}>{children}</S.Wrapper>
    </NewWindow>
  );
};

export default Popup;
