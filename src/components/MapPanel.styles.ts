import styled from 'styled-components';
import Icon from './Icon';

export const IconButtons = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 8px;
  display: flex;
  opacity: 0;
`;

export const Wrapper = styled.div`
  height: 100%;
  canvas {
    display: block;
  }
  &:hover {
    ${IconButtons} {
      opacity: 1;
    }
  }
`;

export const IconButton = styled(Icon)`
  padding: 8px;
  color: white;
  opacity: 0.5;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`;
