import * as S from './Popup.styles';
import React from 'react';
import useResizeObserver from 'use-resize-observer';
import NewWindow from './NewWindow';

export type PopupDirection =
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
  direction?: PopupDirection;
}

const Popup: React.FC<PopupProps> = ({
  className,
  x,
  y,
  direction = 'bottom center',
}) => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  React.useEffect(() => {
    if (width == null || height == null) {
      return;
    }
  }, [width, height]);

  return (
    <S.Wrapper className={className} ref={ref}>
      <NewWindow name="popup" open={true}>
        <S.Contents></S.Contents>
      </NewWindow>
    </S.Wrapper>
  );
};

export default Popup;
