import * as S from './CursorsOverlay.styles';
import React from 'react';

import * as Colyseus from 'colyseus.js';
import produce from 'immer';
import FakeCursor from './FakeCursor';

export interface CursorsOverlayProps {
  className?: string;
  colyseusRoom: Colyseus.Room;
  screenOwnerIdentity: string;
  localIdentity: string;
}

const CursorsOverlay: React.FC<CursorsOverlayProps> = ({
  className,
  colyseusRoom,
  screenOwnerIdentity,
  localIdentity,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const [cursors, setCursors] = React.useState<{
    [identity: string]: { x: number; y: number };
  }>({});

  const flash = (x: string, y: string, color: string) => {
    if (wrapperRef.current == null) {
      return;
    }

    // If we ever actually use this function,
    // we should make it more like flashFocus,
    // with options and absolute position instead of fixed.
    const flasher = document.createElement('div');
    flasher.className = 'flasher';
    wrapperRef.current?.appendChild(flasher);
    flasher.style.left = x;
    flasher.style.top = y;
    flasher.style.borderColor = color;

    window.setTimeout(() => {
      wrapperRef.current?.removeChild(flasher);
    }, 2000);
  };

  React.useEffect(() => {
    colyseusRoom.state.cursors.onAdd = (cursor: any) => {
      if (
        cursor.screenOwnerIdentity === screenOwnerIdentity &&
        cursor.cursorOwnerIdentity !== localIdentity
      ) {
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
      if (
        cursor.screenOwnerIdentity === screenOwnerIdentity &&
        cursor.cursorOwnerIdentity !== localIdentity
      ) {
        setCursors((cs) =>
          produce(cs, (draft) => {
            delete draft[cursor.cursorOwnerIdentity];
          })
        );
      }
    };

    colyseusRoom.onMessage('cursorMouseDown', (cursorData: any) => {
      flash(
        `${cursorData.x * 100}%`,
        `${cursorData.y * 100}%`,
        `#${colyseusRoom.state.players
          .get(cursorData.cursorOwnerIdentity)
          .color.toString(16)}`
      );
    });
  }, [colyseusRoom]);

  return (
    <S.Wrapper className={className} ref={wrapperRef}>
      {Object.entries(cursors).map(([identity, cursor]) => {
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
