import styled, { css } from 'styled-components';
import { DARK_BACKGROUND } from './constants';
import PanelWrapper from './PanelWrapper';

export const LocalUserPanelWrapper = styled(PanelWrapper)``;

export const Wrapper = styled.div<{ recentlyLoud: boolean }>`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 0);
  width: 100%;
  height: 100%;
  background: ${DARK_BACKGROUND.toString()};
  video {
    display: block;
    transform: scale(-1, 1);
    width: 100%;
    height: 100%;
  }
  ${(props) =>
    props.recentlyLoud &&
    css`
      box-shadow: 0 0 0 2px rgba(0, 255, 0, 1);
    `}
`;
