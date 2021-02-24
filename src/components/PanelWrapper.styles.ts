import styled, { css } from 'styled-components';

interface WrapperProps {
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  small?: boolean;
  xDirection: 'left' | 'right';
  minY?: number;
}

export const Wrapper = styled.div<WrapperProps>`
    // transition: width .2s, height .2s, transform .2s, z-index .2s;
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    z-index: 0;
    top: 0;
    ${(props) =>
      props.minY != null &&
      css`
        mask-image: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0),
          rgba(0, 0, 0, 0) ${-props.y + props.minY - 8}px,
          rgba(0, 0, 0, 1) ${-props.y + props.minY}px
        );
      `}
    
    ${(props) =>
      props.xDirection === 'left'
        ? css`
            right: 0;
          `
        : css`
            left: 0;
          `}
    transform: translate(
      ${(props) => props.x * (props.xDirection === 'left' ? -1 : 1)}px,
      ${(props) => props.y}px
    );
    width: ${(props) => props.width}px;
    height: ${(props) => props.height}px;
    border-radius: 4px;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.4),
      0px 0px 0 1px rgba(255, 255, 255, 0.08);
    z-index: ${(props) => props.z || 0};
  `;
