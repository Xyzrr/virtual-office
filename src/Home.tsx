import * as S from './Home.styles';
import React from 'react';
import firebase from 'firebase';
import { ipcRenderer } from 'electron';
import FakeMacOSFrame from './components/FakeMacOSFrame';

export interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className }) => {
  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 720, height: 480 });
  }, []);

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
          <S.Space>
            <S.SpaceName>Welcome area</S.SpaceName>
          </S.Space>
        </S.Spaces>
      </S.Wrapper>
    </>
  );
};

export default Home;
