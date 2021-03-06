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
  -webkit-app-region: no-drag;
  user-select: none;

  &:hover {
    background: rgb(150, 150, 150);
    opacity: 0.5;
  }
  &:active {
    filter: brightness(1.2);
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
