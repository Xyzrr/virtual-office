import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';
import * as Colyseus from 'colyseus.js';
import CursorsOverlay from './CursorsOverlay';
import { ColyseusContext } from '../contexts/ColyseusContext';
import { LocalMediaContext2 } from '../contexts/LocalMediaContext';

export interface ScreenShareOverlayProps {
  className?: string;
  open: boolean;
  localIdentity: string;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className, open, localIdentity }) => {
    const { room: colyseusRoom } = React.useContext(ColyseusContext);
    const { localScreenShareSourceId } = React.useContext(LocalMediaContext2);

    if (colyseusRoom == null) {
      return null;
    }

    return (
      <NewWindow
        name="screen-share-overlay"
        open={open}
        features={`shareSourceId=${localScreenShareSourceId}`}
      >
        <S.Wrapper className={className}>
          <S.Frame />
          <CursorsOverlay
            colyseusRoom={colyseusRoom}
            screenOwnerIdentity={localIdentity}
            localIdentity={localIdentity}
          ></CursorsOverlay>
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareOverlay;
