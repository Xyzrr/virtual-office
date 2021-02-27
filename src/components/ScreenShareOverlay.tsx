import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';
import * as Colyseus from 'colyseus.js';
import produce from 'immer';

export interface ScreenShareOverlayProps {
  className?: string;
  open: boolean;
  colyseusRoom: Colyseus.Room;
  localIdentity: string;
  onStop?(): void;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className, open, onStop, colyseusRoom, localIdentity }) => {
    const [cursors, setCursors] = React.useState<{
      [identity: string]: { x: number; y: number };
    }>({});

    React.useEffect(() => {
      colyseusRoom.state.cursors.onAdd = (cursor: any) => {
        setCursors((cs) =>
          produce(cs, (draft) => {
            draft[cursor.cursorOwnerIdentity] = { x: cursor.x, y: cursor.y };
          })
        );
        cursor.onChange = () => {
          setCursors((cs) =>
            produce(cs, (draft) => {
              draft[cursor.cursorOwnerIdentity].x = cursor.x;
              draft[cursor.cursorOwnerIdentity].y = cursor.y;
            })
          );
        };
      };
    }, [colyseusRoom]);

    return (
      <NewWindow name="screen-share-overlay" open={open}>
        <S.Wrapper className={className}>
          {Object.entries(cursors).map(([identity, cursor]) => (
            <S.RemoteCursor
              style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
            ></S.RemoteCursor>
          ))}
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareOverlay;
