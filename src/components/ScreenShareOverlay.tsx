import * as S from './ScreenShareOverlay.styles';
import React from 'react';
import NewWindow from './NewWindow';
import * as Colyseus from 'colyseus.js';
import produce from 'immer';
import FakeCursor from './FakeCursor';

export interface ScreenShareOverlayProps {
  className?: string;
  open: boolean;
  colyseusRoom: Colyseus.Room;
  localIdentity: string;
  displayId?: string;
  onStop?(): void;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(
  ({ className, open, colyseusRoom, localIdentity, displayId, onStop }) => {
    const [cursors, setCursors] = React.useState<{
      [identity: string]: { x: number; y: number };
    }>({});

    React.useEffect(() => {
      colyseusRoom.state.cursors.onAdd = (cursor: any) => {
        if (cursor.screenOwnerIdentity === localIdentity) {
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
        }
      };

      colyseusRoom.state.cursors.onRemove = (cursor: any) => {
        if (cursor.screenOwnerIdentity === localIdentity) {
          setCursors((cs) =>
            produce(cs, (draft) => {
              delete draft[cursor.cursorOwnerIdentity];
            })
          );
        }
      };
    }, [colyseusRoom]);

    return (
      <NewWindow
        name="screen-share-overlay"
        open={open}
        features={displayId == null ? undefined : `shareDisplayId=${displayId}`}
      >
        <S.Wrapper className={className}>
          {Object.entries(cursors).map(([identity, cursor]) => {
            console.log('wtf', colyseusRoom.state.players.get(identity));
            return (
              <FakeCursor
                x={`${cursor.x * 100}%`}
                y={`${cursor.y * 100}%`}
                color={`#${colyseusRoom.state.players
                  .get(identity)
                  .color.toString(16)}`}
              ></FakeCursor>
            );
          })}
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenShareOverlay;
