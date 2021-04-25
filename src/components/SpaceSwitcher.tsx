import * as S from './SpaceSwitcher.styles';
import React from 'react';
import useSpaces from '../hooks/useSpaces';
import { MenuItem, MenuList, Paper } from '@material-ui/core';

export interface SpaceSwitcherProps {
  className?: string;
}

const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({ className }) => {
  const spaces = useSpaces();
  return (
    <Paper>
      <MenuList dense>
        {spaces.map((space) => {
          return <MenuItem>{space.metadata.spaceName}</MenuItem>;
        })}
      </MenuList>
    </Paper>
  );
  return <S.Wrapper className={className}>hello world</S.Wrapper>;
};

export default SpaceSwitcher;
