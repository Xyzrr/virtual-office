import * as S from './Home.styles';
import React from 'react';
import firebase from 'firebase';
import { ipcRenderer } from 'electron';
import FakeMacOSFrame from './components/FakeMacOSFrame';
import { useHistory } from 'react-router-dom';

export interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className }) => {
  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 720, height: 480 });
  }, []);

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
          <S.Space
            onClick={() => {
              history.push('/s/welcome');
            }}
          >
            <S.SpaceName>Welcome harbor</S.SpaceName>
          </S.Space>
          <S.Space
            onClick={() => {
              history.push('/s/midnight');
            }}
          >
            <S.SpaceName>Midnight lounge</S.SpaceName>
          </S.Space>
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
