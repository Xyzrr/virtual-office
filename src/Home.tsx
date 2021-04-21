import * as S from './Home.styles';
import React from 'react';
import firebase from 'firebase';

export interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className }) => {
  React.useEffect(() => {
    firebase.auth().currentUser;
  });
  const user = firebase.auth().currentUser;

  return (
    <S.Wrapper className={className}>
      <S.TopBar>
        {user && (
          <S.UserInfo>
            <S.UserName>{user.displayName}</S.UserName>
            {user.photoURL && <S.UserPhoto src={user.photoURL}></S.UserPhoto>}
          </S.UserInfo>
        )}
      </S.TopBar>
    </S.Wrapper>
  );
};

export default Home;
