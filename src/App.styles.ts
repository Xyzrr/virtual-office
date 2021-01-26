import styled, { createGlobalStyle, css } from 'styled-components';

export const GlobalStyles = createGlobalStyle<{ minimized?: boolean }>`
  body {
    // background: green;
  }
  ${(props) =>
    props.minimized
      ? css`
          ${PanelWrapper} {
            -webkit-app-region: drag;
          }
        `
      : css`
          ${DraggableBar} {
            -webkit-app-region: drag;
          }
        `}
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
`;
