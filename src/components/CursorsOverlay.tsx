import * as S from './CursorsOverlay.styles';
import React from 'react';

import * as Colyseus from 'colyseus.js';
import produce from 'immer';
import FakeCursor from './FakeCursor';

/**
 * Flashes a growing blue ring around the element, like a single
 * ripple in water.
 * @param el The element to flash.
 */
export const flash = (el: Element) => {
  // If we ever actually use this function,
  // we should make it more like flashFocus,
  // with options and absolute position instead of fixed.
  const rect = el.getBoundingClientRect();

  const flasher = document.createElement('div');
  flasher.className = 'flasher';
  document.body.appendChild(flasher);
  flasher.style.left = `${rect.left + rect.width / 2}px`;
  flasher.style.top = `${rect.top + rect.height / 2}px`;

  window.setTimeout(() => {
    document.body.removeChild(flasher);
  }, 2000);
};

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
  const [cursors, setCursors] = React.useState<{
    [identity: string]: { x: number; y: number };
  }>({});

  const flash = (x: number, y: number) => {
    // If we ever actually use this function,
    // we should make it more like flashFocus,
    // with options and absolute position instead of fixed.
    const flasher = document.createElement('div');
    flasher.className = 'flasher';
    document.body.appendChild(flasher);
    flasher.style.left = `${x}px`;
    flasher.style.top = `${y}px`;

    window.setTimeout(() => {
      document.body.removeChild(flasher);
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
      console.log('RECEIVED MOUSE DOWN', cursorData);
      flash(400, 400);
    });
  }, [colyseusRoom]);

  return (
    <S.Wrapper className={className}>
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
