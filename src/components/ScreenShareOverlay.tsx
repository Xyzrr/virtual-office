import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';

export interface ScreenShareOverlayProps {
  className?: string;
  open: boolean;
  onStop?(): void;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className, open, onStop }) => {
    return (
      <NewWindow name="screen-share-overlay" open={open}>
        <S.Wrapper className={className}></S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareOverlay;
