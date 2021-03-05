import styled, { css } from 'styled-components';

export const InnerWrapper = styled.div`
  height: 100%;
`;

export const Wrapper = styled.div<{
  z?: number;
  xDirection: 'left' | 'right';
  floating?: boolean;
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

  ${(props) =>
    props.floating &&
    css`
      ${InnerWrapper} {
        border-radius: 4px;
        box-shadow: 0px 0px 1px rgba(255, 255, 255, 0.4),
          0px 2px 6px rgba(0, 0, 0, 0.4);
      }
    `}
`;
