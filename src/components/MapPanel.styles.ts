import styled from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div`
  height: 100%;
  canvas {
    display: block;
  }
`;

export const IconButton = styled(Icon)`
  position: absolute;
  bottom: 8px;
  left: 8px;
  color: white;
`;
