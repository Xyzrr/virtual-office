import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{
  z?: number;
  xDirection: 'left' | 'right';
}>`
  // transition: width 0.2s, height 0.2s, transform 0.2s, z-index 0.2s;

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

  // padding adds room for a border around the panel
        padding: 8px;
`;

export const InnerWrapper = styled.div`
  border-radius: 4px;
  height: 100%;
  box-shadow: 0px 0px 1px rgba(255, 255, 255, 0.4),
    0px 2px 6px rgba(0, 0, 0, 0.4);
`;
