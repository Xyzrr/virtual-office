import styled, { css } from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div`
  color: white;
  width: fit-content;
  height: fit-content;
`;

export const CurrentSignal = styled(Icon).attrs({
  name: 'signal_cellular_alt',
})<{ networkQuality: number }>`
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  ${(props) =>
    props.networkQuality < 2
      ? css`
          width: 40%;
        `
      : props.networkQuality < 4
      ? css`
          width: 65%;
        `
      : css``}
`;
export const MaxSignal = styled(Icon).attrs({
  name: 'signal_cellular_alt',
})`
  opacity: 0.25;
  display: block;
`;
