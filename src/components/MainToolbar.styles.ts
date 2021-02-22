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
    background: rgb(160, 160, 160);
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

export const IconButton = styled.div<{
  color?: string;
}>`
  position: relative;
  height: 56px;
  width: 56px;
  color: white;
  margin-right: 24px;
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
          }
          ${IconButtonIcon}, ${CaretButton} {
            opacity: 1;
          }
        `
      : props.color === 'good'
      ? css`
          ${IconButtonBackground}, ${CaretButtonWrapper} {
            background: lime;
            opacity: 1;
          }
          ${IconButtonIcon}, ${CaretButton} {
            opacity: 1;
          }
        `
      : ''}
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

  &:hover {
    background: rgba(160, 160, 160, 0.4);
  }
`;

export const ScreenShareButton = styled(Icon)<{ active?: boolean }>`
  padding: 8px;
  color: white;
  cursor: pointer;
  opacity: 0.5;
  &:hover {
    opacity: 1 !important;
  }
  ${(props) =>
    props.active &&
    css`
      color: lime;
      opacity: 1 !important;
    `}
`;

export const Wrapper = styled.div<{ minimized?: boolean }>`
  display: flex;
  position: absolute;
  bottom: 24px;
`;
