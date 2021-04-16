import Button from './components/Button';
import styled from 'styled-components';
import { DARK_BACKGROUND, LIGHT_BACKGROUND } from './components/constants';

export const Wrapper = styled.div`
  background: ${LIGHT_BACKGROUND.toString()};
  height: 100vh;
  padding: 32px;
  color: white;
  -webkit-app-region: drag;
`;

export const Logo = styled.h1`
  text-align: center;
`;

export const Buttons = styled.div`
  padding: 32px;
  border-radius: 8px;
  background: ${DARK_BACKGROUND.toString()};
  display: flex;
  flex-direction: column;
  max-width: 360px;
  margin: 0 auto;
`;

export const LoginButton = styled(Button).attrs({
  variant: 'contained',
  color: 'primary',
  size: 'large',
})`
  margin-bottom: 12px;
`;

export const GuestButton = styled(Button).attrs({
  variant: 'contained',
})``;
