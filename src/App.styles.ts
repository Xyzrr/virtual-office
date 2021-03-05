import styled, { createGlobalStyle, css } from 'styled-components';
import * as PanelWrapperStyles from './components/PanelWrapper.styles';
import Icon from './components/Icon';
import { LIGHT_BACKGROUND, DARK_BACKGROUND } from './components/constants';

export const GlobalStyles = createGlobalStyle<{
  minimized?: boolean;
  focused?: boolean;
}>`
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }
  * {
    box-sizing: border-box;
  }
  ${(props) =>
    props.minimized
      ? css`
          ${AppWrapper}, ${PanelWrapperStyles.Wrapper} {
            -webkit-app-region: ${process.platform === 'win32'
              ? 'no-drag'
              : 'drag'} !important;
          }
          ${AppWrapper} {
            &:hover {
              background: rgba(80, 80, 80, 0.25);
            }
          }
          ${DraggableBar} {
            display: none;
          }
        `
      : css`
          ${DraggableBar} {
            -webkit-app-region: ${process.platform === 'win32'
              ? 'no-drag'
              : 'drag'};
          }
          ${AppWrapper} {
            background: ${DARK_BACKGROUND.toString()} !important;
          }
        `}
      ${(props) =>
        props.focused &&
        css`
          ${AppWrapper} {
            && {
              background: rgba(80, 80, 80, 0.4);
            }
          }
        `}
`;

export const AppWrapper = styled.div`
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const AppContents = styled.div`
  position: relative;
  height: 0;
  flex-grow: 1;
`;

export const DraggableBar = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 40px;
  z-index: 1;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const TopBar = styled.div<{ focused: boolean }>`
  flex-grow: 0;
  height: 40px;
  background: ${(props) =>
    props.focused ? LIGHT_BACKGROUND.toString() : '#222'};
  -webkit-app-region: drag;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const TabIcon = styled(Icon)`
  color: #bbb;
  font-size: 15px;
  margin-right: 4px;
`;

export const Tab = styled.div<{ selected?: boolean; iconOnly?: boolean }>`
  -webkit-app-region: no-drag;
  padding: 6px 12px;
  margin: 2px;
  color: #ccc;
  font-size: 13px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  ${(props) =>
    props.iconOnly &&
    css`
      padding: 6px;
      ${TabIcon} {
        margin: 0;
      }
    `}

  ${(props) =>
    props.selected &&
    css`
      background: rgba(255, 255, 255, 0.15) !important;
      color: white;
    `}
`;

export const LeftButtons = styled.div`
  ${process.platform === 'darwin' &&
  css`
    margin-left: 78px;
  `}
`;

export const ExitButton = styled(Icon)`
  background: rgb(253, 50, 74);
  color: white;
  transform: rotate(180deg);
  border-radius: 4px;
  font-size: 15px;
  padding: 5px;
  &:hover {
    background: rgb(255, 80, 100);
  }
`;

export const MiddleButtons = styled.div`
  display: flex;
  align-items: center;
  margin-left: 24px;
`;

export const RightButtons = styled.div`
  display: flex;
  margin-right: 8px;
`;
