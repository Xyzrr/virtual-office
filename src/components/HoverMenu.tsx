import * as S from './HoverMenu.styles';
import React from 'react';

export interface HoverMenuProps {
  className?: string;
}

const HoverMenu: React.FC<HoverMenuProps> = ({ className, children }) => {
  return (
    <S.Wrapper className={className}>
      <S.Menu>{children}</S.Menu>
    </S.Wrapper>
  );
};

export default HoverMenu;
