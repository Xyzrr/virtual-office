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
import electronDebug from 'electron-debug';

export interface AuthProps {
  className?: string;
}

const Auth: React.FC<AuthProps> = ({ className }) => {
  const [url, setUrl] = React.useState<string>();
  const [guest, setGuest] = React.useState(false);
  const history = useHistory();
  const [error, setError] = React.useState<Error>();

  const { app: firebaseApp, user, loadingUser } = useContext(FirebaseContext);

  React.useEffect(() => {
    if (user) {
      console.log('Already signed in');
      history.push('/home');
    }
  }, [user]);

  React.useEffect(() => {
    ipcRenderer.send('setWindowSize', { width: 360, height: 360 });
  }, []);

  React.useEffect(() => {
    ipcRenderer.invoke('getUrl').then(setUrl);

    const onOpenUrl = (e: Electron.IpcRendererEvent, url: string) => {
      setUrl(url);
    };

    ipcRenderer.on('openUrl', onOpenUrl);

    return () => {
      ipcRenderer.off('openUrl', onOpenUrl);
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      if (url == null) {
        return;
      }

      ipcRenderer.send('clearUrl');

      let hasCredential = url.substr(0, 20).includes('credential');
      if (hasCredential) {
        console.log('FOUND CREDENTIAL IN URL:', url);
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

        let user: firebase.auth.UserCredential;
        try {
          user = await firebaseApp.auth().signInWithCredential(credential);
        } catch (e) {
          setError(e);
          return;
        }

        history.push('/home');
        return;
      }

      const token = url.split('=')[1];
      console.log('TRYING TOKEN:', token);
      let response: Response;
      try {
        response = await fetch(
          `http://${HOST}/create-custom-token?id=${token}`
        );
      } catch (e) {
        setError(e);
        return;
      }

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
        user = await firebaseApp.auth().signInWithCustomToken(text);
      } catch (e) {
        setError(e);
        return;
      }

      console.log('USER:', user);
      history.push('/home');
    })();
  }, [url]);

  if (loadingUser) {
    return (
      <S.Wrapper>
        <Loader />
      </S.Wrapper>
    );
  }

  return (
    <>
      <FakeMacOSFrame />
      <S.Wrapper className={className}>
        <S.Logo>Harbor</S.Logo>
        {url == null && !guest ? (
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
                  user = await firebaseApp.auth().signInAnonymously();
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
                setUrl(undefined);
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
