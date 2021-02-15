import * as S from './ScreenSharePicker.styles';

import React from 'react';
import { desktopCapturer } from 'electron';
import { DesktopCapturerSource } from 'electron/main';
import NewWindow from './NewWindow';

export interface ScreenSharePickerProps {
  className?: string;
  open: boolean;
}

const ScreenSharePicker: React.FC<ScreenSharePickerProps> = React.memo(
  ({ className, open }) => {
    const [sources, setSources] = React.useState<DesktopCapturerSource[]>([]);

    React.useEffect(() => {
      if (!open) {
        return;
      }

      desktopCapturer
        .getSources({
          types: ['window', 'screen'],
        })
        .then((s) => {
          setSources(s);
        });
    }, [open]);

    for (const source of sources) {
      console.log('sources', source);
    }

    return (
      <NewWindow name="screen-share-picker" open={open}>
        <S.Wrapper className={className}>
          {sources.map((source) => {
            return (
              <S.ScreenShareOption
                key={source.id}
                onClick={() => {
                  console.log('Selected screen', source.display_id);
                }}
              >
                {source.appIcon != null && (
                  <img src={source.appIcon.toDataURL()}></img>
                )}
                {source.thumbnail != null && (
                  <img src={source.thumbnail.toDataURL()}></img>
                )}
                {source.name}
              </S.ScreenShareOption>
            );
          })}
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenSharePicker;
