import * as S from './AppSharingHelper.styles';
import React from 'react';
import Icon from './Icon';

export interface AppSharingHelperProps {
  className?: string;
}

const AppSharingHelper: React.FC<AppSharingHelperProps> = ({ className }) => {
  return (
    <S.Wrapper className={className}>
      <Icon name="grid"></Icon>
    </S.Wrapper>
  );
};

export default AppSharingHelper;
