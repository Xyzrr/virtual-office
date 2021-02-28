import styled, { keyframes } from 'styled-components';

const flash = keyframes`
  0%   {
      opacity: 0;
      transform: scale(0.5);
      // border-width: 4px;
  }
  50%  {
      opacity: 0.2;
  }
  100% {
      opacity: 0;
      transform: scale(1.8);
      border-width: 0;
  }
`;

export const Wrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .flasher {
    pointer-events: none;
    animation: 0.6s ease-out 0s ${flash};
    opacity: 0;
    z-index: 10000;
    margin-left: -20px;
    margin-top: -20px;
    width: 40px;
    height: 40px;
    border-radius: 100%;
    transform-origin: 50% 50%;
    border: 4px solid @linkBlue;
    position: fixed;
  }
`;
