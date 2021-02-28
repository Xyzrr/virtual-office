import * as S from './CursorsOverlay.styles';
import React from 'react';

import * as Colyseus from 'colyseus.js';
import produce from 'immer';
import FakeCursor from './FakeCursor';

export interface CursorsOverlayProps {
  className?: string;
  colyseusRoom: Colyseus.Room;
  localIdentity: string;
}

const CursorsOverlay: React.FC<CursorsOverlayProps> = ({
  className,
  colyseusRoom,
  localIdentity,
}) => {
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
  );
};

export default CursorsOverlay;
