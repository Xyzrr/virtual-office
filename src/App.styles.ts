import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    // background: green;
  }
`;

export const DraggableBar = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
  margin-bottom: -40px;
  z-index: 100;
  -webkit-app-region: drag;
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
  transition: transform 0.4s, width 0.4s, height 0.4s;
  transform: translate(${(props) => props.x}px, ${(props) => props.y}px);
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  border-radius: 4px;
  overflow: hidden;
`;
