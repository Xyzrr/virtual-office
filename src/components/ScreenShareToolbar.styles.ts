import styled, { css } from 'styled-components';
import Button from './Button';

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #222;
  -webkit-app-region: drag;
`;

export const StopButton = styled(Button).attrs({
  color: 'danger',
  variant: 'contained',
})``;
