import styled, { css } from 'styled-components';
import Icon from './Icon';

export const IconButtonBackground = styled.div<{
  mask?: string;
}>`
  background: rgb(120, 120, 120);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0.4;
  border-radius: 50%;

  &:hover {
    background: rgb(150, 150, 150);
    opacity: 0.5;
  }
  ${(props) =>
    props.mask &&
    css`
      mask: url(${props.mask});
    `}
`;

export const IconButtonIcon = styled(Icon)`
  display: block;
  pointer-events: none;
  z-index: 1;
`;

export const CaretButton = styled(Icon).attrs({ name: 'expand_more' })`
  color: white;
  font-size: 16px;
  padding: 2px;
  display: block;
  opacity: 0.5;
`;

export const CaretButtonWrapper = styled.div`
  position: absolute;
  z-index: 1;
  right: 0px;
  bottom: 0px;
  background: rgba(120, 120, 120, 0.4);
  border-radius: 50%;
  overflow: hidden;
  &:hover {
    background: rgba(150, 150, 150, 0.5);
  }
`;

export const IconButton = styled.div<{
  color?: string;
}>`
  pointer-events: auto;
  flex-shrink: 0;
  position: relative;
  height: 56px;
  width: 56px;
  color: white;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${IconButtonIcon} {
    opacity: 0.5;
  }

  ${(props) =>
    props.color === 'danger'
      ? css`
          ${IconButtonBackground}, ${CaretButtonWrapper} {
            background: red;
            opacity: 1;
            &:hover {
              background: rgb(255, 60, 60);
            }
          }
          ${IconButtonIcon}, ${CaretButton} {
            opacity: 1;
          }
        `
      : props.color === 'good'
      ? css`
          ${IconButtonBackground}, ${CaretButtonWrapper} {
            background: rgb(0, 180, 0);
            opacity: 1;
            &:hover {
              background: rgb(60, 200, 60);
            }
          }
          ${IconButtonIcon}, ${CaretButton} {
            opacity: 1;
          }
        `
      : ''}
`;

export const Wrapper = styled.div<{
  minimized?: boolean;
  hide?: boolean;
}>`
  pointer-events: none;
  display: flex;
  position: absolute;
  bottom: 16px;
  width: 100%;
  justify-content: center;
  z-index: 2;

  transition: opacity 0.2s, transform 0.2s;
  ${(props) =>
    props.hide &&
    css`
      opacity: 0;
      transform: translateY(12px);
    `}

  ${(props) =>
    props.minimized &&
    css`
      top: 108px;
      bottom: auto;

      ${props.hide &&
      css`
        transform: translateY(6px);
      `}

      ${IconButton} {
        margin-right: 8px;
        width: 28px;
        height: 28px;
        .material-icons-outlined {
          font-size: 18px;
        }
      }
    `}
`;
