import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ recentlyLoud: boolean }>`
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 0);
  video {
    display: block;
    transform: scale(-1, 1);
  }
  ${(props) =>
    props.recentlyLoud &&
    css`
      box-shadow: 0 0 0 2px rgba(0, 255, 0, 1);
    `}
`;
