import * as S from './AppSharingHelper.styles';
import React from 'react';
import Icon from './Icon';
import Popup from './Popup';
import PopupTrigger from './PopupTrigger';
import Button from './Button';
import { LocalInfoContext } from '../contexts/LocalInfoContext';
import { ipcRenderer } from 'electron';
import { access } from 'fs';
import AppIndicator from './AppIndicator';

export interface AppSharingHelperProps {
  className?: string;
}

const AppSharingHelper: React.FC<AppSharingHelperProps> = ({ className }) => {
  console.log('sharing render');
  const { appSharingOn, setAppSharingOn, localApp } = React.useContext(
    LocalInfoContext
  );
  const [accessibility, setAccessibility] = React.useState<boolean>();

  React.useEffect(() => {
    if (!appSharingOn || accessibility == null || accessibility) {
      return;
    }

    const interval = window.setInterval(async () => {
      setAccessibility(
        await ipcRenderer.invoke('isTrustedAccessibilityClient', false)
      );
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [appSharingOn, accessibility]);

  let popupContent: React.ReactNode;
  let appIcon: React.ReactNode;

  if (appSharingOn == null) {
    popupContent = (
      <S.PopupContent>
        <h3>Turn on app sharing?</h3>
        <p>
          Help your teammates know when you're busy by sharing the work app
          you're currently using.
        </p>
        <p>You can change your mind at any time in Settings.</p>
        <S.Actions>
          <Button
            onClick={() => {
              setAppSharingOn(false);
            }}
          >
            No thanks
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={async () => {
              setAccessibility(
                await ipcRenderer.invoke('isTrustedAccessibilityClient', true)
              );
              setAppSharingOn(true);
            }}
          >
            Start sharing
          </Button>
        </S.Actions>
      </S.PopupContent>
    );
    appIcon = <S.PlaceholderIcon />;
  }

  if (appSharingOn && !accessibility) {
    popupContent = (
      <S.PopupContent>
        <h3>Harbor needs accessibility permission for app sharing.</h3>
        <p>
          MacOS Security &amp; Privacy Settings &gt; Privacy &gt; Accessibility
        </p>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            ipcRenderer.send(
              'openSystemPreferences',
              'security',
              'Privacy_Accessibility'
            );
          }}
        >
          Open MacOS Privacy Settings
        </Button>
      </S.PopupContent>
    );
    appIcon = <S.PlaceholderIcon />;
  }

  if (appSharingOn != null && !appSharingOn) {
    popupContent = (
      <S.PopupContent>
        <h3>App sharing is off.</h3>
        <p>You can turn it at any time in Settings.</p>
      </S.PopupContent>
    );
  }

  if (appSharingOn && accessibility && !localApp) {
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
        <h3>You are currently using {localApp.name}.</h3>
        <p>You can stop sharing this info at any time in Settings.</p>
      </S.PopupContent>
    );
    appIcon = <AppIndicator appInfo={localApp} />;
  }

  return (
    <PopupTrigger popupContent={() => popupContent}>
      {({ anchorAttributes, open }) => (
        <S.Wrapper {...anchorAttributes}>{appIcon}</S.Wrapper>
      )}
    </PopupTrigger>
  );
};

export default AppSharingHelper;
