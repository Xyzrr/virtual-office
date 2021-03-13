import * as S from './PermissionHelperWindow.styles';

import React from 'react';
import NewWindow from './NewWindow';
import { ipcRenderer } from 'electron';
import Button from './Button';

export interface PermissionHelperWindowProps {
  className?: string;
  open: boolean;
  onClose?(): void;
  onGranted?(): void;
}

const PermissionHelperWindow: React.FC<PermissionHelperWindowProps> = React.memo(
  ({ className, open, onClose, onGranted }) => {
    React.useEffect(() => {
      if (!open) {
        return;
      }

      const interval = window.setInterval(async () => {
        const screenAccess = await ipcRenderer.invoke(
          'getMediaAccessStatus',
          'screen'
        );

        if (screenAccess === 'granted') {
          onGranted?.();
        }
      }, 2000);

      return () => {
        window.clearInterval(interval);
      };
    }, [open]);

    return (
      <NewWindow name="permission-helper-window" open={open} onClose={onClose}>
        <S.Wrapper>
          <S.TopBar><Button size="small" onClick={onClose}>Cancel</Button></S.TopBar>
          <S.Title>
            To screen share, Harbor needs screen recording permission.
          </S.Title>
          <S.SubTitle>
            MacOS Security &amp; Privacy Settings > Privacy > Screen Recording
          </S.SubTitle>
          <Button color="primary" variant="contained" size="large">Open MacOS Privacy Settings</Button>
        </S.Wrapper>
      </NewWindow>
    );
  }
);

export default PermissionHelperWindow;
