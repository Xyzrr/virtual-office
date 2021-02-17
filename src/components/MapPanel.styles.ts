import styled, { css } from 'styled-components';
import Icon from './Icon';

export const IconButtons = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 8px;
  display: flex;
  align-items: center;
`;

export const IconButton = styled(Icon)<{
  disabled?: boolean;
  forceDisplay?: boolean;
}>`
  padding: 8px;
  color: white;
  cursor: pointer;
  opacity: 0.5 ${(props) => (props.forceDisplay ? '!important' : '')};
  &:hover {
    opacity: 1 !important;
  }
  ${(props) =>
    props.disabled &&
    css`
      color: red;
      opacity: 1 !important;
    `}
`;

export const CaretButton = styled(Icon).attrs({ name: 'expand_more' })`
  padding: 2px;
  color: white;
  font-size: 16px;
  opacity: 0.5;
  cursor: pointer;
`;

export const CaretButtonWrapper = styled.div`
  position: relative;
  z-index: 1;
  margin-left: -10px;
  overflow: hidden;
  select {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  &:hover {
    ${CaretButton} {
      opacity: 1;
    }
  }
`;

export const MicVolumeOverlayWrapper = styled.div<{ forceDisplay?: boolean }>`
  position: absolute;
  bottom: 8px;
  left: 8px;
  overflow: hidden;
  width: 40px;
  max-height: 40px;
  pointer-events: none;
  ${(props) =>
    props.forceDisplay &&
    css`
      opacity: 1 !important;
    `}
`;

export const MicVolumeOverlay = styled(Icon)`
  position: absolute;
  padding: 8px;
  bottom: 0;
  left: 0;
  color: lime;
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

export const Wrapper = styled.div<{
  small: boolean;
}>`
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
  canvas {
    display: block;
  }
  ${(props) =>
    props.small &&
    css`
      ${IconButtons} {
        padding: 4px;
      }
      ${IconButton}, ${MicVolumeOverlayWrapper}, ${ScreenShareButton} {
        padding: 4px;
        opacity: 0;
      }
      ${MicVolumeOverlayWrapper} {
        bottom: 4px;
        left: 4px;
        width: 32px;
        max-height: 32px;
      }
      ${MicVolumeOverlay} {
        padding: 4px;
      }
      &:hover {
        ${IconButton}, ${ScreenShareButton} {
          opacity: 0.5;
        }
        ${MicVolumeOverlayWrapper} {
          opacity: 1;
        }
      }
    `}
`;
