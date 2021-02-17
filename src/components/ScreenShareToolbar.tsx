import * as S from './ScreenShareToolbar.styles';
import React from 'react';
import NewWindow from './NewWindow';

export interface ScreenShareToolbarProps {
  className?: string;
  open: boolean;
  onStop?(): void;
}

const ScreenShareToolbar: React.FC<ScreenShareToolbarProps> = React.memo(
  ({ className, open, onStop }) => {
    return (
      <NewWindow name="screen-share-toolbar" open={open}>
        <S.Wrapper className={className}>
          <S.StopButton onClick={onStop}></S.StopButton>
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareToolbar;
