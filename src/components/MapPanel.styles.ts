import styled from 'styled-components';

export const Wrapper = styled.div<{
  small: boolean;
}>`
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  canvas {
    display: block;
  }
`;
