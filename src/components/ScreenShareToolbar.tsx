import * as S from './ScreenShareToolbar.styles';
import React from 'react';
import NewWindow from './NewWindow';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { CallObjectContext } from '../contexts/CallObjectContext';

export interface ScreenShareToolbarProps {
  className?: string;
}

const ScreenShareToolbar: React.FC<ScreenShareToolbarProps> = React.memo(
  ({ className }) => {
    const { setLocalScreenShareOn } = React.useContext(LocalMediaContext);
    const { localScreenShareTrulyOn } = React.useContext(CallObjectContext);

    return (
      <NewWindow name="screen-share-toolbar" open={localScreenShareTrulyOn}>
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
