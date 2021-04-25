import * as S from './SpaceSwitcher.styles';
import React from 'react';
import useSpaces from '../hooks/useSpaces';
import { Divider, MenuItem, MenuList, Paper } from '@material-ui/core';
import Loader from './Loader';
import { useHistory } from 'react-router-dom';

export interface SpaceSwitcherProps {
  className?: string;
}

const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({ className }) => {
  const spaces = useSpaces();
  const history = useHistory();
  return (
    <Paper>
      <MenuList dense>
        {spaces.length === 0 && (
          <S.LoaderMenuItem>
            <Loader></Loader>
          </S.LoaderMenuItem>
        )}
        {spaces.map((space) => {
          return (
            <MenuItem
              onClick={() => {
                history.push('/s/' + space.metadata.spaceId);
              }}
            >
              {space.metadata.spaceName}
            </MenuItem>
          );
        })}
        <Divider></Divider>
        <MenuItem
          onClick={() => {
            history.push('/home');
          }}
        >
          Exit
        </MenuItem>
      </MenuList>
    </Paper>
  );
};

export default SpaceSwitcher;
