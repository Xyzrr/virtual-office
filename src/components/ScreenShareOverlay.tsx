import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';
import * as Colyseus from 'colyseus.js';
import CursorsOverlay from './CursorsOverlay';

export interface ScreenShareOverlayProps {
  className?: string;
  open: boolean;
  colyseusRoom: Colyseus.Room;
  localIdentity: string;
  sourceId: string;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className, open, colyseusRoom, localIdentity, sourceId }) => {
    return (
      <NewWindow
        name="screen-share-overlay"
        open={open}
        features={`shareSourceId=${sourceId}`}
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
