import * as S from './SpaceSwitcher.styles';
import React from 'react';
import useSpaces from '../hooks/useSpaces';
import { Divider, MenuItem, MenuList, Paper } from '@material-ui/core';
import Loader from './Loader';
import { useHistory } from 'react-router-dom';
import SpaceAvatar from './SpaceAvatar';

export interface SpaceSwitcherProps {
  className?: string;
}

const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({ className }) => {
  const spaces = useSpaces();
  const history = useHistory();
  return (
    <Paper>
      <MenuList dense>
        {spaces ? (
          spaces.map((space) => {
            return (
              <MenuItem
                onClick={() => {
                  history.push('/s/' + space.metadata.spaceId);
                }}
              >
                <S.StyledSpaceAvatar
                  spaceName={space.metadata.spaceName}
                ></S.StyledSpaceAvatar>
                {space.metadata.spaceName}
              </MenuItem>
            );
          })
        ) : (
          <S.LoaderMenuItem>
            <Loader></Loader>
          </S.LoaderMenuItem>
        )}
        <S.StyledDivider></S.StyledDivider>
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
