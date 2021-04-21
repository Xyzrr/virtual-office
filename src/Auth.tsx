import * as S from './Auth.styles';
import React from 'react';
import 'firebaseui/dist/firebaseui.css';
import { ipcRenderer } from 'electron';
import firebase from 'firebase';
import { HOST } from './components/constants';
import { useHistory } from 'react-router-dom';

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
        const text = await response.text();
        console.log('TEXT:', text);
        const user = await app.auth().signInWithCustomToken(text);
        console.log('USER:', user);
        history.push('/home');
      }
    );
  }, [link]);

  return (
    <S.Wrapper className={className}>
      <S.Buttons>
        <S.Logo>Harbor</S.Logo>
        {link}
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
    </S.Wrapper>
  );
};

export default Auth;
