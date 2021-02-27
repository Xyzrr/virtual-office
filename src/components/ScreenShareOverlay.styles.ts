import styled, { css } from 'styled-components';
import Button from './Button';

export const Wrapper = styled.div`
  height: 100vh;
  border: 4px solid rgba(121, 231, 121, 0.5);
  position: relative;
  overflow: hidden;
`;

export const RemoteCursor = styled.div`
  position: absolute;
  width: 40px;
  height: 40px;
  background: red;
`;
