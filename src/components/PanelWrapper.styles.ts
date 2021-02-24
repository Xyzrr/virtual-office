import styled, { css } from 'styled-components';

interface WrapperProps {
  z?: number;
  xDirection: 'left' | 'right';
}

export const Wrapper = styled.div<WrapperProps>`
  // transition: width .2s, height .2s, transform .2s, z-index .2s;
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  z-index: 0;
  top: 0;
  ${(props) =>
    props.xDirection === 'left'
      ? css`
          right: 0;
        `
      : css`
          left: 0;
        `}
  border-radius: 4px;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.4),
    0px 0px 0 1px rgba(255, 255, 255, 0.08);
  z-index: ${(props) => props.z || 0};
`;
