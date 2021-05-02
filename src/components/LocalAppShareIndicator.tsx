import * as S from './LocalAppShareIndicator.styles';
import React from 'react';
import PopupTrigger from './PopupTrigger';
import Button from './Button';
import { LocalInfoContext } from '../contexts/LocalInfoContext';
import { ipcRenderer } from 'electron';
import AppIndicator from './AppIndicator';

const LocalAppShareIndicator: React.FC = () => {
  const { appSharingOn, setAppSharingOn, localApp } = React.useContext(
    LocalInfoContext
  );

  let popupContent: React.ReactNode;
  let appIcon: React.ReactNode;

  if (appSharingOn != null && !appSharingOn) {
    popupContent = (
      <S.PopupContent>
        <h3>App sharing is off.</h3>
        <p>You can turn it at any time in Settings.</p>
      </S.PopupContent>
    );
  }

  if (appSharingOn && !localApp) {
    popupContent = (
      <S.PopupContent>
        <h3>App sharing is on.</h3>
        <p>
          An app icon will appear here when you start using a supported work
          app.
        </p>
      </S.PopupContent>
    );
  }

  if (appSharingOn && localApp) {
    popupContent = (
      <S.PopupContent>
        <h3>Currently using {localApp.name}</h3>
        <p>You can stop sharing this info at any time in Settings.</p>
      </S.PopupContent>
    );
    appIcon = <AppIndicator appInfo={localApp} />;
  }

  return (
    <PopupTrigger
      popupContent={() => popupContent}
      anchorOrigin="bottom right"
      transformOrigin="top right"
    >
      {({ anchorAttributes, open }) => (
        <S.Wrapper {...anchorAttributes} open={open}>
          {appIcon}
        </S.Wrapper>
      )}
    </PopupTrigger>
  );
};

export default LocalAppShareIndicator;
