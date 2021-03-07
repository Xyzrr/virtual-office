import styled from 'styled-components';
import { DARK_BACKGROUND } from './constants';
import PanelWrapper from './PanelWrapper';

export const MapPanelWrapper = styled(PanelWrapper)``;

export const Wrapper = styled.div<{
  small: boolean;
}>`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  canvas {
    display: block;
    background: ${DARK_BACKGROUND.toString()};
  }
`;
