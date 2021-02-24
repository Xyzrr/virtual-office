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
            -webkit-app-region: drag !important;
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
            -webkit-app-region: drag;
          }
          ${AppWrapper} {
            background: black;
          }
        `}
      ${(props) =>
        props.focused &&
        css`
          ${AppWrapper} {
            background: rgba(80, 80, 80, 0.4) !important;
          }
        `}
`;

export const AppWrapper = styled.div`
  height: 100vh;
  position: relative;
  overflow: hidden;
`;

export const DraggableBar = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
  margin-bottom: -40px;
  z-index: 1;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;
