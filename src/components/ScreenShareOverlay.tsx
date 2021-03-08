import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';
import CursorsOverlay from './CursorsOverlay';
import { ColyseusContext } from '../contexts/ColyseusContext';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { VideoCallContext } from '../contexts/VideoCallContext/VideoCallContext';
import { LocalInfoContext } from '../contexts/LocalInfoContext';

export interface ScreenShareOverlayProps {
  className?: string;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className }) => {
    const { room: colyseusRoom } = React.useContext(ColyseusContext);
    const { localScreenShareSourceId } = React.useContext(LocalMediaContext);
    const { participants } = React.useContext(VideoCallContext);
    const { localIdentity } = React.useContext(LocalInfoContext);

    if (colyseusRoom == null) {
      return null;
    }

    const screenShareTrulyOn =
      participants[localIdentity] &&
      !!participants[localIdentity].screenVideoTrack;

    return (
      <NewWindow
        name="screen-share-overlay"
        open={screenShareTrulyOn}
        features={`shareSourceId=${localScreenShareSourceId}`}
      >
        <S.Wrapper className={className}>
          <S.Frame />
          <CursorsOverlay screenOwnerIdentity={localIdentity} />
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareOverlay;
