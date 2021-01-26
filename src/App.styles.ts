import styled, { createGlobalStyle, css } from 'styled-components';

export const GlobalStyles = createGlobalStyle<{
  minimized?: boolean;
  focused?: boolean;
}>`
  body {
    // background: green;
  }
  ${(props) =>
    props.minimized
      ? css`
          ${AppWrapper} {
            -webkit-app-region: drag;
          }
        `
      : css`
          ${DraggableBar} {
            -webkit-app-region: drag;
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
  width: 100vw;
  height: 100vh;
  &:hover {
    background: rgba(80, 80, 80, 0.25);
  }
`;

export const DraggableBar = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
  margin-bottom: -40px;
  z-index: 100;
`;

export const PanelWrapper = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
}>`
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  top: 0;
  left: 0;
  transform: translate(${(props) => props.x}px, ${(props) => props.y}px);
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.4),
    0px 0px 0 1px rgba(255, 255, 255, 0.08);
`;
