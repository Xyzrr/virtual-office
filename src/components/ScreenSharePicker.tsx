import * as S from './ScreenSharePicker.styles';

import React from 'react';
import { desktopCapturer } from 'electron';
import { DesktopCapturerSource } from 'electron/main';
import NewWindow from './NewWindow';
import { StyleSheetManager } from 'styled-components';

export interface ScreenSharePickerProps {
  className?: string;
  open: boolean;
  onClose?(): void;
}

const ScreenSharePicker: React.FC<ScreenSharePickerProps> = React.memo(
  ({ className, open, onClose }) => {
    const [screenSources, setScreenSources] = React.useState<
      DesktopCapturerSource[]
    >([]);
    const [windowSources, setWindowSources] = React.useState<
      DesktopCapturerSource[]
    >([]);

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
                    onClick={() => {
                      console.log('Selected screen', source.display_id);
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
                    onClick={() => {
                      console.log('Selected screen', source.display_id);
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
            <S.ShareButton>Share</S.ShareButton>
          </S.BottomBar>
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default ScreenSharePicker;
