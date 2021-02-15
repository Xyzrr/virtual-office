import * as S from './ScreenSharePicker.styles';

import React from 'react';
import { desktopCapturer } from 'electron';
import { DesktopCapturerSource } from 'electron/main';
import NewWindow from './NewWindow';
import { StyleSheetManager } from 'styled-components';
import Button from './Button';

export interface ScreenSharePickerProps {
  className?: string;
  open: boolean;
  onClose?(): void;
  onStart?(id: string): void;
}

const ScreenSharePicker: React.FC<ScreenSharePickerProps> = React.memo(
  ({ className, open, onClose, onStart }) => {
    const [screenSources, setScreenSources] = React.useState<
      DesktopCapturerSource[]
    >([]);
    const [windowSources, setWindowSources] = React.useState<
      DesktopCapturerSource[]
    >([]);
    const [selectedSourceId, setSelectedSourceId] = React.useState<
      string | null
    >(null);

    React.useEffect(() => {
      if (!open) {
        return;
      }

      desktopCapturer
        .getSources({
          types: ['screen'],
          thumbnailSize: { width: 288, height: 162 },
        })
        .then((s) => {
          setScreenSources(s);
        });

      desktopCapturer
        .getSources({
          types: ['window'],
          thumbnailSize: { width: 180, height: 120 },
          fetchWindowIcons: true,
        })
        .then((s) => {
          setWindowSources(s);
        });
    }, [open]);

    return (
      <NewWindow name="screen-share-picker" open={open} onClose={onClose}>
        <S.Wrapper className={className}>
          <S.TopBar>Screen Share</S.TopBar>

          <S.ScreensSectionWrapper>
            <S.Title>Screens</S.Title>
            <S.ScreenShareOptionsWrapper>
              {screenSources.map((source) => {
                return (
                  <S.ScreenShareOption
                    key={source.id}
                    selected={source.id === selectedSourceId}
                    onClick={() => {
                      console.log(
                        'Selected screen',
                        source.id,
                        source.display_id
                      );
                      setSelectedSourceId(source.id);
                    }}
                    onDoubleClick={() => {
                      onStart?.(source.id);
                    }}
                  >
                    {source.thumbnail != null && (
                      <S.ScreenOptionThumbnailWrapper>
                        <S.ScreenOptionThumbnail
                          src={source.thumbnail.toDataURL()}
                        ></S.ScreenOptionThumbnail>
                      </S.ScreenOptionThumbnailWrapper>
                    )}
                  </S.ScreenShareOption>
                );
              })}
            </S.ScreenShareOptionsWrapper>
          </S.ScreensSectionWrapper>
          <S.Divider />
          <S.WindowsSectionWrapper>
            <S.Title>Apps</S.Title>
            <S.ScreenShareOptionsWrapper>
              {windowSources.map((source) => {
                return (
                  <S.ScreenShareOption
                    key={source.id}
                    selected={source.id === selectedSourceId}
                    onClick={() => {
                      console.log(
                        'Selected window',
                        source.id,
                        source.display_id
                      );
                      setSelectedSourceId(source.id);
                    }}
                    onDoubleClick={() => {
                      onStart?.(source.id);
                    }}
                  >
                    <S.WindowOptionLabel>
                      {source.appIcon != null && (
                        <S.WindowOptionAppIcon
                          src={source.appIcon.toDataURL()}
                        ></S.WindowOptionAppIcon>
                      )}
                      <S.WindowOptionName>{source.name}</S.WindowOptionName>
                    </S.WindowOptionLabel>
                    {source.thumbnail != null && (
                      <S.WindowOptionThumbnailWrapper>
                        <S.WindowOptionThumbnail
                          src={source.thumbnail.toDataURL()}
                        ></S.WindowOptionThumbnail>
                      </S.WindowOptionThumbnailWrapper>
                    )}
                  </S.ScreenShareOption>
                );
              })}
            </S.ScreenShareOptionsWrapper>
          </S.WindowsSectionWrapper>
          <S.BottomBar>
            <S.ShareButton
              color="primary"
              variant="contained"
              disabled={selectedSourceId == null}
              onClick={() => {
                if (selectedSourceId != null) {
                  onStart?.(selectedSourceId);
                }
              }}
            >
              Share
            </S.ShareButton>
            <S.CancelButton onClick={onClose}>Cancel</S.CancelButton>
          </S.BottomBar>
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenSharePicker;
