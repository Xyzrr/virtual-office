import * as S from './Auth.styles';
import React from 'react';
import 'firebaseui/dist/firebaseui.css';
import { ipcRenderer } from 'electron';
import firebase from 'firebase';
import { HOST } from './components/constants';
import { useHistory } from 'react-router-dom';
import Loader from './components/Loader';
import Button from './components/Button';
import FakeMacOSFrame from './components/FakeMacOSFrame';

export const firebaseConfig = {
  apiKey: 'AIzaSyA89oz2--yQCG8AieZNa_7j-gPcJsBFyEA',
  authDomain: 'harbor-chat.firebaseapp.com',
  projectId: 'harbor-chat',
  storageBucket: 'harbor-chat.appspot.com',
  messagingSenderId: '222349427903',
  appId: '1:222349427903:web:6433be4de99f7c5df5720a',
  measurementId: 'G-5C5J3GGJ06',
};

export interface AuthProps {
  className?: string;
}

const Auth: React.FC<AuthProps> = ({ className }) => {
  const [link, setLink] = React.useState<string>();
  const history = useHistory();
  const [error, setError] = React.useState<Error>();

  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 420, height: 420 });
  }, []);

  React.useEffect(() => {
    ipcRenderer.invoke('getLink').then(setLink);

    ipcRenderer.on('openUrl', (e, d) => {
      setLink(d);
    });
  }, []);

  React.useEffect(() => {
    if (link == null) {
      return;
    }

    const app = firebase.initializeApp(firebaseConfig);
    const token = link.split('=')[1];
    console.log('trying token', token);
    fetch(`http://${HOST}/create-custom-token?id=${token}`).then(
      async (response) => {
        console.log('RESPONSE:', response);

        let text: string;

        try {
          text = await response.text();
        } catch (e) {
          setError(e);
          return;
        }

        console.log('TEXT:', text);

        let user: firebase.auth.UserCredential;
        try {
          user = await app.auth().signInWithCustomToken(text);
        } catch (e) {
          setError(e);
          return;
        }

        console.log('USER:', user);
        history.push('/home');
      }
    );
  }, [link]);

  return (
    <>
      <FakeMacOSFrame />
      <S.Wrapper className={className}>
        <S.Logo>Harbor</S.Logo>
        {link == null ? (
          <S.Buttons>
            <S.LoginButton
              variant="contained"
              color="primary"
              size="large"
              href="http://www.meet.harbor.chat"
              target="_blank"
            >
              Sign in via browser
            </S.LoginButton>
            <S.GuestButton variant="contained">Enter as guest</S.GuestButton>
          </S.Buttons>
        ) : error ? (
          <S.ErrorWrapper>
            <S.ErrorTitle>Could not sign in</S.ErrorTitle>
            <S.ErrorDetails>{error.message}</S.ErrorDetails>
            <Button
              variant="contained"
              onClick={() => {
                setLink(undefined);
                setError(undefined);
              }}
            >
              Try again
            </Button>
          </S.ErrorWrapper>
        ) : (
          <S.LoaderWrapper>
            <Loader />
          </S.LoaderWrapper>
        )}
      </S.Wrapper>
    </>
  );
};

export default Auth;
