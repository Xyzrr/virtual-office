import styled, { css } from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div<{
  small: boolean;
}>`
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
  canvas {
    display: block;
  }
`;
