import * as S from './CursorsOverlay.styles';
import React from 'react';

import FakeCursor from './FakeCursor';
import { ColyseusContext } from '../contexts/ColyseusContext';

export interface CursorsOverlayProps {
  className?: string;
  screenOwnerIdentity: string;
  localIdentity: string;
}

const CursorsOverlay: React.FC<CursorsOverlayProps> = ({
  className,
  screenOwnerIdentity,
  localIdentity,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const [cursors, setCursors] = React.useState<{
    [identity: string]: { x: number; y: number; color: number; name: string };
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

  const { addListener, removeListener, room } = React.useContext(
    ColyseusContext
  );

  console.log('CURSORS', cursors);

  React.useEffect(() => {
    if (!room) {
      return;
    }

    const onPlayerUpdated = () => {
      console.log('preprocessed', room.state.players.entries());
      console.log(
        'postprocessed',
        room?.state.players.entries(),
        (Array.from(room?.state.players.entries()) as any).map(
          ([i, p]: [string, any]) => p.x
        ),
        room?.state.players.entries().map(([i, p]: [string, any]) => p.cursor),
        room?.state.players
          .entries()
          .filter(
            ([i, p]: [string, any]) =>
              p.identity !== localIdentity &&
              p.cursor &&
              p.cursor.surfaceType === 'screen' &&
              p.cursor.surfaceId === screenOwnerIdentity
          )
          .map(([i, p]: [string, any]) => ({
            x: p.cursor.x,
            y: p.cursor.y,
            color: p.color,
            name: p.name,
          }))
      );

      setCursors(
        (Array.from(room?.state.players.entries()) as any)
          .filter(
            ([i, p]: [string, any]) =>
              p.identity !== localIdentity &&
              p.cursor &&
              p.cursor.surfaceType === 'screen' &&
              p.cursor.surfaceId === screenOwnerIdentity
          )
          .map(([i, p]: [string, any]) => ({
            x: p.cursor.x,
            y: p.cursor.y,
            color: p.color,
            name: p.name,
          }))
      );
    };

    addListener('player-updated', onPlayerUpdated);

    return () => {
      removeListener('player-updated', onPlayerUpdated);
    };
  }, [room]);

  React.useEffect(() => {
    if (!room) {
      return;
    }

    const remove = room.onMessage('cursorMouseDown', (mouseDownData: any) => {
      if (
        mouseDownData.surfaceType === 'screen' &&
        mouseDownData.surfaceId === screenOwnerIdentity
      ) {
        flash(
          `${mouseDownData.x * 100}%`,
          `${mouseDownData.y * 100}%`,
          `#${room.state.players
            .get(mouseDownData.cursorOwnerIdentity)
            .color.toString(16)}`
        );
      }
    });

    console.log('REMOVE', remove);

    return remove;
  }, [room]);

  return (
    <S.Wrapper className={className} ref={wrapperRef}>
      {Object.entries(cursors).map(([identity, cursor]) => {
        return (
          <FakeCursor
            x={`${cursor.x * 100}%`}
            y={`${cursor.y * 100}%`}
            color={`#${cursor.color.toString(16)}`}
          ></FakeCursor>
        );
      })}
    </S.Wrapper>
  );
};

export default CursorsOverlay;
