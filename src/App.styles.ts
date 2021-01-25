import styled from 'styled-components';

export const DraggableBar = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
  margin-bottom: -40px;
  z-index: 100;
  -webkit-app-region: drag;
`;

export const Container = styled.div`
  canvas {
    display: block;
  }
`;

export const TracksContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`;

export const PanelWrapper = styled.div<{ x: number; y: number }>`
  position: fixed;
  top: 0;
  left: 0;
  transition: transform 0.2s;
  transform: translate(${(props) => props.x}px, ${(props) => props.y}px);
  border-radius: 4px;
  overflow: hidden;
`;
