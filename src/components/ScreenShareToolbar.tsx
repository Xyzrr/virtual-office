import * as S from './ScreenShareToolbar.styles';
import React from 'react';
import NewWindow from './NewWindow';
import { LocalMediaContext2 } from '../contexts/LocalMediaContext';

export interface ScreenShareToolbarProps {
  className?: string;
  open: boolean;
}

const ScreenShareToolbar: React.FC<ScreenShareToolbarProps> = React.memo(
  ({ className, open }) => {
    const { setLocalScreenShareOn } = React.useContext(LocalMediaContext2);

    return (
      <NewWindow name="screen-share-toolbar" open={open}>
        <S.Wrapper className={className}>
          <S.StopButton
            onClick={() => {
              setLocalScreenShareOn(false);
            }}
          >
            Stop screenshare
          </S.StopButton>
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareToolbar;
