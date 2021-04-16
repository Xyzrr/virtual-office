import * as S from './Auth.styles';
import React from 'react';
import 'firebaseui/dist/firebaseui.css';
import { ipcRenderer } from 'electron';

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

  return (
    <S.Wrapper className={className}>
      <S.Buttons>
        <S.Logo>Harbor</S.Logo>
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
