import * as S from './AppSharingHelper.styles';
import React from 'react';
import Icon from './Icon';
import Popup from './Popup';
import PopupTrigger from './PopupTrigger';

export interface AppSharingHelperProps {
  className?: string;
}

const AppSharingHelper: React.FC<AppSharingHelperProps> = ({ className }) => {
  console.log('sharing render');

  return (
    <PopupTrigger
      popupContent={() => (
        <S.PopupContent>Would you like to turn on app sharing?</S.PopupContent>
      )}
    >
      {({ anchorAttributes, open }) => (
        <S.Wrapper className={className} {...anchorAttributes} />
      )}
    </PopupTrigger>
  );
};

export default AppSharingHelper;
