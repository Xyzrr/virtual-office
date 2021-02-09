import styled from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div<{ volume: number }>`
  video {
    display: block;
    width: 100%;
    height: 100%;
  }
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, ${(props) => Math.min(props.volume, 1)});
`;

export const StatusIcons = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 4px;
  display: flex;
`;

export const StatusIcon = styled(Icon)`
  padding: 4px;
  color: red;
`;
