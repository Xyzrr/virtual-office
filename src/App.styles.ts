import styled, { createGlobalStyle, css } from 'styled-components';

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
          ${AppWrapper}, ${PanelWrapper} {
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
          ${PanelWrapper} {
            box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.7),
              0px 0px 0 1px rgba(255, 255, 255, 0.2) !important;
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

export const PanelWrapper = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
  small?: boolean;
  xDirection: 'left' | 'right';
}>`
  transition: width .2s, height .2s, transform .2s, z-index .2s;
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  z-index: 0;
  top: 0;
  ${(props) =>
    props.xDirection === 'left'
      ? css`
          right: 0;
        `
      : css`
          left: 0;
        `}
  transform: translate(
    ${(props) => props.x * (props.xDirection === 'left' ? -1 : 1)}px,
    ${(props) => props.y}px
  );
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  border-radius: 4px;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.4),
    0px 0px 0 1px rgba(255, 255, 255, 0.08);
  ${(props) =>
    props.small &&
    css`
      z-index: 2;
      -webkit-app-region: no-drag;
    `}
`;
