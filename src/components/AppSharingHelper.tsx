import * as S from './AppSharingHelper.styles';
import React from 'react';
import Icon from './Icon';
import Popup from './Popup';
import PopupTrigger from './PopupTrigger';
import Button from './Button';

export interface AppSharingHelperProps {
  className?: string;
}

const AppSharingHelper: React.FC<AppSharingHelperProps> = ({ className }) => {
  console.log('sharing render');

  return (
    <PopupTrigger
      popupContent={() => (
        <S.PopupContent>
          <h3>Turn on app sharing?</h3>
          <p>
            Help your teammates know when you're busy by sharing the work app
            you're currently using.
          </p>
          <p>You can change your mind at any time in Settings.</p>
          <S.Actions>
            <Button>No thanks</Button>
            <Button color="primary" variant="contained">
              Start sharing
            </Button>
          </S.Actions>
        </S.PopupContent>
      )}
    >
      {({ anchorAttributes, open }) => (
        <S.Wrapper className={className} {...anchorAttributes} />
      )}
    </PopupTrigger>
  );
};

export default AppSharingHelper;
