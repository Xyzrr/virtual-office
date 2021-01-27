import styled, { css } from 'styled-components';
import Icon from './Icon';

export const IconButtons = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 8px;
  display: flex;
`;

export const IconButton = styled(Icon)<{ disabled?: boolean }>`
  padding: 8px;
  color: white;
  cursor: pointer;
  opacity: 0;
  &:hover {
    opacity: 1 !important;
  }
  ${(props) =>
    props.disabled &&
    css`
      color: red;
      opacity: 1 !important;
    `}
`;

export const Wrapper = styled.div`
  height: 100%;
  canvas {
    display: block;
  }
  &:hover {
    ${IconButton} {
      opacity: 0.5;
    }
  }
`;
