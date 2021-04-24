import * as S from './Auth.styles';
import React, { useContext } from 'react';
import 'firebaseui/dist/firebaseui.css';
import { ipcRenderer } from 'electron';
import firebase from 'firebase';
import { HOST } from './components/constants';
import { useHistory } from 'react-router-dom';
import Loader from './components/Loader';
import Button from './components/Button';
import FakeMacOSFrame from './components/FakeMacOSFrame';
import { FirebaseContext } from './contexts/FirebaseContext';

export interface AuthProps {
  className?: string;
}

const Auth: React.FC<AuthProps> = ({ className }) => {
  const [link, setLink] = React.useState<string>();
  const [guest, setGuest] = React.useState(false);
  const history = useHistory();
  const [error, setError] = React.useState<Error>();

  const { app } = useContext(FirebaseContext);

  React.useEffect(() => {
    if (app.auth().currentUser != null) {
      console.log('Already signed in');
      history.push('/home');
    }
  }, [app]);

  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 360, height: 360 });
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

    const token = link.split('=')[1];
    console.log('trying token', token);
    fetch(`http://${HOST}/create-custom-token?id=${token}`).then(
      async (response) => {
        if (response.status === 500) {
          setError(new Error('Your token may have expired. Please try again.'));
          return;
        }

        let text: string;

        try {
          text = await response.text();
        } catch (e) {
          setError(e);
          return;
        }

        let user: firebase.auth.UserCredential;
        try {
          user = await app.auth().signInWithCustomToken(text);
        } catch (e) {
          setError(e);
          return;
        }

        console.log('USER:', user);
        history.push('/home');
      },
      (error) => {
        console.log('ERRORED OUT', error);
      }
    );
  }, [link]);

  return (
    <>
      <FakeMacOSFrame />
      <S.Wrapper className={className}>
        <S.Logo>Harbor</S.Logo>
        {link == null && !guest ? (
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
            <S.GuestButton
              variant="contained"
              onClick={async () => {
                setGuest(true);
                let user: firebase.auth.UserCredential;
                try {
                  user = await app.auth().signInAnonymously();
                } catch (e) {
                  setError(e);
                  return;
                }
                console.log('ANONYMOUS USER:', user);
                history.push('/home');
              }}
            >
              Enter as guest
            </S.GuestButton>
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
                setGuest(false);
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
