import * as S from './SpaceSwitcher.styles';
import React from 'react';
import useSpaces from '../hooks/useSpaces';
import { Divider, MenuItem, MenuList, Paper } from '@material-ui/core';
import Loader from './Loader';
import { useHistory, useParams } from 'react-router-dom';
import SpaceAvatar from './SpaceAvatar';

export interface SpaceSwitcherProps {
  className?: string;
}

const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({ className }) => {
  const { spaces, error } = useSpaces();
  const history = useHistory();
  const params = useParams() as any;

  const resortedSpaces = spaces?.sort((a, b) =>
    a.metadata.spaceId === params.spaceId
      ? -1
      : b.metadata.spaceId === params.spaceId
      ? 1
      : 0
  );

  return (
    <Paper>
      <MenuList dense variant="menu">
        {resortedSpaces ? (
          resortedSpaces.map((space) => {
            return (
              <MenuItem
                selected={params.spaceId === space.metadata.spaceId}
                key={space.metadata.spaceId}
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
