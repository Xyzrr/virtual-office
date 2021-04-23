import * as S from './Home.styles';
import React from 'react';
import firebase from 'firebase';
import { ipcRenderer } from 'electron';
import FakeMacOSFrame from './components/FakeMacOSFrame';
import { useHistory } from 'react-router-dom';
import { HOST } from './components/constants';
import * as Colyseus from 'colyseus.js';

export interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className }) => {
  const [spaces, setSpaces] = React.useState<Colyseus.RoomAvailable[]>([]);

  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 720, height: 480 });
  }, []);

  React.useEffect(() => {
    const client = new Colyseus.Client(`ws://${HOST}`);
    client.joinOrCreate('lobby').then((lobby) => {
      lobby.onMessage('rooms', (rooms) => {
        setSpaces(rooms);
      });
    });
  }, []);

  console.log('SPACES', spaces);

  const history = useHistory();

  const user = firebase.auth().currentUser;

  return (
    <>
      <FakeMacOSFrame />
      <S.Wrapper className={className}>
        <S.TopBar>
          <S.Heading>Spaces</S.Heading>
          {user && (
            <S.UserInfo>
              <S.UserName>{user.displayName}</S.UserName>
              {user.photoURL && <S.UserPhoto src={user.photoURL}></S.UserPhoto>}
            </S.UserInfo>
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
