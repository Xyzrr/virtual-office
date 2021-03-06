import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';
import * as Colyseus from 'colyseus.js';
import CursorsOverlay from './CursorsOverlay';
import { ColyseusContext } from '../contexts/ColyseusContext';
import { LocalMediaContext2 } from '../contexts/LocalMediaContext';
import { CallObjectContext } from '../contexts/CallObjectContext';

export interface ScreenShareOverlayProps {
  className?: string;
  localIdentity: string;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className, localIdentity }) => {
    const { room: colyseusRoom } = React.useContext(ColyseusContext);
    const { localScreenShareSourceId } = React.useContext(LocalMediaContext2);
    const { localScreenShareTrulyOn } = React.useContext(CallObjectContext);

    if (colyseusRoom == null) {
      return null;
    }

    return (
      <NewWindow
        name="screen-share-overlay"
        open={localScreenShareTrulyOn}
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
