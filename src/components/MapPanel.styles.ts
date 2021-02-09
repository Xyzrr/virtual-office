import styled, { css } from 'styled-components';
import Icon from './Icon';

export const IconButtons = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 8px;
  display: flex;
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

export const Wrapper = styled.div<{
  minimized: boolean;
}>`
  height: 100%;
  canvas {
    display: block;
  }
  ${(props) =>
    props.minimized &&
    css`
      ${IconButtons} {
        padding: 4px;
      }
      ${IconButton}, ${MicVolumeOverlayWrapper} {
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
        ${IconButton} {
          opacity: 0.5;
        }
        ${MicVolumeOverlayWrapper} {
          opacity: 1;
        }
      }
    `}
`;
