import * as S from './Auth.styles';
import React from 'react';

export interface AuthProps {
  className?: string;
}

const Auth: React.FC<AuthProps> = ({ className }) => {
  return <S.Wrapper className={className}>Hello world</S.Wrapper>;
};

export default Auth;
