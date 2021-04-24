import * as S from './Home.styles';
import React from 'react';
import { ipcRenderer } from 'electron';
import FakeMacOSFrame from './components/FakeMacOSFrame';
import { useHistory } from 'react-router-dom';
import { HOST } from './components/constants';
import * as Colyseus from 'colyseus.js';
import { useImmer } from 'use-immer';
import PopupTrigger from './components/PopupTrigger';
import { Menu, MenuItem, MenuList, Paper } from '@material-ui/core';
import { FirebaseContext } from './contexts/FirebaseContext';

export interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className }) => {
  const [spaces, setSpaces] = useImmer<Colyseus.RoomAvailable[]>([]);

  const { app: firebaseApp, user } = React.useContext(FirebaseContext);

  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 720, height: 480 });
  }, []);

  React.useEffect(() => {
    const client = new Colyseus.Client(`ws://${HOST}`);
    client.joinOrCreate('lobby').then((lobby) => {
      lobby.onMessage('rooms', (rooms) => {
        setSpaces(rooms);
      });

      lobby.onMessage('+', ([roomId, room]) => {
        setSpaces((draft) => {
          const spaceIndex = draft.findIndex(
            (space) => space.roomId === roomId
          );

          if (spaceIndex === -1) {
            draft.push(room);
          } else {
            draft[spaceIndex] = room;
          }
        });
      });

      lobby.onMessage('-', (roomId) => {
        setSpaces((draft) => {
          const spaceIndex = draft.findIndex(
            (space) => space.roomId === roomId
          );
          delete draft[spaceIndex];
        });
      });
    });
  }, []);

  console.log('SPACES', spaces);

  const history = useHistory();

  return (
    <>
      <FakeMacOSFrame />
      <S.Wrapper className={className}>
        <S.TopBar>
          <S.Heading>Spaces</S.Heading>
          {user && (
            <PopupTrigger
              anchorOrigin="bottom right"
              transformOrigin="top right"
              popupContent={() => {
                return (
                  <Paper>
                    <MenuList dense>
                      <MenuItem>Profile</MenuItem>
                      <MenuItem>Account settings</MenuItem>
                      <MenuItem
                        onClick={async () => {
                          await firebaseApp.auth().signOut();
                          history.push('/');
                        }}
                      >
                        Sign out
                      </MenuItem>
                    </MenuList>
                  </Paper>
                );
              }}
            >
              {({ anchorAttributes, open }) => {
                return (
                  <S.UserInfo {...anchorAttributes} open={open}>
                    <S.UserName>{user.displayName}</S.UserName>
                    {user.photoURL && (
                      <S.UserPhoto src={user.photoURL}></S.UserPhoto>
                    )}
                  </S.UserInfo>
                );
              }}
            </PopupTrigger>
          )}
        </S.TopBar>
        <S.Spaces>
          {spaces.map((space) => {
            return (
              <S.Space
                onClick={() => {
                  history.push(`/s/${space.metadata.spaceId}`);
                }}
              >
                <S.SpaceName>{space.metadata.spaceName}</S.SpaceName>
                {space.clients > 0 && (
                  <S.SpaceActivity>
                    <S.GreenDot />
                    {space.clients} user{space.clients === 1 ? '' : 's'} online
                  </S.SpaceActivity>
                )}
              </S.Space>
            );
          })}
          <S.CreateSpace>
            <S.CreateSpaceTitle>Create new space</S.CreateSpaceTitle>
            <S.CreateSpaceSubTitle>Coming soon!</S.CreateSpaceSubTitle>
          </S.CreateSpace>
        </S.Spaces>
      </S.Wrapper>
    </>
  );
};

export default Home;
