import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ recentlyLoud: boolean }>`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 0);
  background: rgba(255, 255, 255, 0.2);
  width: 100%;
  height: 100%;
  video {
    display: block;
    transform: scale(-1, 1);
    width: 100%;
    height: 100%;
    background: black;
  }
  ${(props) =>
    props.recentlyLoud &&
    css`
      box-shadow: 0 0 0 2px rgba(0, 255, 0, 1);
    `}
`;
