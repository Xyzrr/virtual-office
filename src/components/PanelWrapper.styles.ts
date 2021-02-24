import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{
  z?: number;
  xDirection: 'left' | 'right';
}>`
  // transition: width .2s, height .2s, transform .2s, z-index .2s;

  filter: drop-shadow(0px 0px 1px rgba(255, 255, 255, 0.4))
    drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.4));

  position: absolute;
  z-index: ${(props) => props.z || 0};
  top: 0;
  ${(props) =>
    props.xDirection === 'left'
      ? css`
          right: 0;
        `
      : css`
          left: 0;
        `}
`;

export const InnerWrapper = styled.div`
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  height: 100%;
`;
