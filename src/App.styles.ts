import styled, { css } from 'styled-components';
import { DARK_BACKGROUND, DANGER } from './components/constants';
import { MapPanelWrapper } from './components/MapPanel.styles';
import { LocalUserPanelWrapper } from './components/LocalUserPanel.styles';

export const AppWrapper = styled.div<{
  welcomePanelOpen: boolean;
  minimized: boolean;
  focused: boolean;
}>`
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  ${(props) =>
    props.welcomePanelOpen &&
    css`
      ${MapPanelWrapper} {
        right: -200px;
      }
      ${LocalUserPanelWrapper} {
        opacity: 0;
      }
    `}

  ${(props) =>
    props.minimized
      ? css`
          -webkit-app-region: ${process.platform === 'win32'
            ? 'no-drag'
            : 'drag'};
          &:hover {
            background: rgba(80, 80, 80, 0.25);
          }
        `
      : css`
          background: ${DARK_BACKGROUND.toString()} !important;
        `}

  ${(props) =>
    props.focused &&
    css`
      && {
        background: rgba(80, 80, 80, 0.4);
      }
    `}
`;

export const AppContents = styled.div`
  height: 0;
  flex-grow: 1;
`;

export const ColyseusError = styled.div`
  background: ${DANGER.toString()};
  color: white;
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 13px;
`;
