import styled, { css } from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div<{ recentlyLoud: boolean }>`
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 0);
  video {
    display: block;
    width: 100%;
    height: 100%;
  }
  ${(props) =>
    props.recentlyLoud &&
    css`
      box-shadow: 0 0 0 2px rgba(0, 255, 0, 1);
    `}
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
