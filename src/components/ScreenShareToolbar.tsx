import * as S from './ScreenShareToolbar.styles';
import React from 'react';
import NewWindow from './NewWindow';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { VideoCallContext } from '../contexts/CallObjectContext';
import { LocalInfoContext } from '../contexts/LocalInfoContext';

export interface ScreenShareToolbarProps {
  className?: string;
}

const ScreenShareToolbar: React.FC<ScreenShareToolbarProps> = React.memo(
  ({ className }) => {
    const { setLocalScreenShareOn } = React.useContext(LocalMediaContext);
    const { participants } = React.useContext(VideoCallContext);
    const { localIdentity } = React.useContext(LocalInfoContext);

    const screenShareTrulyOn =
      participants[localIdentity] &&
      !!participants[localIdentity].screenVideoTrack;

    return (
      <NewWindow name="screen-share-toolbar" open={screenShareTrulyOn}>
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
