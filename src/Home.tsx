import * as S from './Home.styles';
import React from 'react';
import { ipcRenderer } from 'electron';
import FakeMacOSFrame from './components/FakeMacOSFrame';
import { Redirect, useHistory } from 'react-router-dom';
import { HOST } from './components/constants';
import * as Colyseus from 'colyseus.js';
import { useImmer } from 'use-immer';
import firebase from 'firebase';
import PopupTrigger from './components/PopupTrigger';
import { Menu, MenuItem, MenuList, Paper } from '@material-ui/core';
import { FirebaseContext } from './contexts/FirebaseContext';
import useSpaces from './hooks/useSpaces';

export interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className }) => {
  const { app: firebaseApp, user } = React.useContext(FirebaseContext);

  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 720, height: 480 });
  }, []);

  const history = useHistory();
  const spaces = useSpaces();

  React.useEffect(() => {
    ipcRenderer.on('openUrl', async (e, url) => {
      ipcRenderer.send('clearUrl');
      let hasCredential = url.substr(0, 20).includes('credential');
      if (hasCredential && user?.isAnonymous) {
        const encodedCredential = url.split('=')[1];
        const credentialJSON = JSON.parse(
          decodeURIComponent(encodedCredential)
        );
        const credential = firebase.auth.AuthCredential.fromJSON(
          credentialJSON
        );
        console.log('TRYING CREDENTIAL:', credential);

        if (credential == null) {
          return;
        }

        let u: firebase.auth.UserCredential;
        try {
          u = await user.linkWithCredential(credential);
        } catch (e) {
          console.log('Failed to link with credential', e);
          return;
        }
      }
    });
  });

  if (!user) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <FakeMacOSFrame />
      <S.Wrapper className={className}>
        <S.TopBar>
          <S.Heading>Spaces</S.Heading>
          {user.isAnonymous ? (
            <S.GuestSignInButton
              href="http://www.meet.harbor.chat"
              target="_blank"
            >
              Sign in
            </S.GuestSignInButton>
          ) : (
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
          {spaces &&
            spaces.map((space) => {
              return (
                <S.Space
                  key={space.metadata.spaceId}
                  onClick={() => {
                    history.push(`/s/${space.metadata.spaceId}`);
                  }}
                >
                  <S.SpaceName>{space.metadata.spaceName}</S.SpaceName>
                  {space.clients > 0 && (
                    <S.SpaceActivity>
                      <S.GreenDot />
                      {space.clients} user{space.clients === 1 ? '' : 's'}{' '}
                      online
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
