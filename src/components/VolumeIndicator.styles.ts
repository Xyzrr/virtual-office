import styled from 'styled-components';
import Icon from './Icon';

export const CurrentVolumeWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  overflow: hidden;
  width: 100%;
`;
export const CurrentVolume = styled(Icon).attrs({
  name: 'mic',
})<{ volume: number }>`
  position: absolute;
  color: lime;
  overflow: hidden;
  bottom: 0;
`;
export const MaxVolume = styled(Icon).attrs({
  name: 'mic',
})`
  opacity: 0.5;
  display: block;
`;

export const Wrapper = styled.div<{ volume: number }>`
  color: white;
  width: fit-content;
  height: fit-content;
  position: relative;
  pointer-events: none;
  z-index: 1;

  ${CurrentVolumeWrapper} {
    height: ${(props) => Math.floor(props.volume * 1000)}%;
  }
`;
