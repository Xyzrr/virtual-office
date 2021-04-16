import * as S from './Auth.styles';
import React from 'react';
import firebase from 'firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { ipcRenderer } from 'electron';

const firebaseConfig = {
  apiKey: 'AIzaSyA89oz2--yQCG8AieZNa_7j-gPcJsBFyEA',
  authDomain: 'harbor-chat.firebaseapp.com',
  projectId: 'harbor-chat',
  storageBucket: 'harbor-chat.appspot.com',
  messagingSenderId: '222349427903',
  appId: '1:222349427903:web:6433be4de99f7c5df5720a',
  measurementId: 'G-5C5J3GGJ06',
};

var uiConfig = {
  signInSuccessUrl: '<url-to-redirect-to-on-success>',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
  ],
  // tosUrl and privacyPolicyUrl accept either url string or a callback
  // function.
  // Terms of service url/callback.
  tosUrl: '<your-tos-url>',
  // Privacy policy url/callback.
  privacyPolicyUrl: function () {
    window.location.assign('<your-privacy-policy-url>');
  },
};

export interface AuthProps {
  className?: string;
}

const Auth: React.FC<AuthProps> = ({ className }) => {
  const [link, setLink] = React.useState<string>();

  React.useEffect(() => {
    ipcRenderer.invoke('getLink').then(setLink);

    ipcRenderer.on('openUrl', (e, d) => {
      setLink(d);
    });
  }, []);

  return <S.Wrapper className={className}>Hello world {link}</S.Wrapper>;
};

export default Auth;
