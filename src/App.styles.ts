import styled, { createGlobalStyle, css } from 'styled-components';
import * as PanelWrapperStyles from './components/PanelWrapper.styles';

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
            background: black !important;
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
  height: calc(100vh - 40px);
  position: relative;
  overflow: hidden;
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
  height: 40px;
  background: ${(props) => (props.focused ? '#262626' : '#222')};
  -webkit-app-region: drag;
`;
