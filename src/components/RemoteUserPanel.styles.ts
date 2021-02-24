import styled, { css } from 'styled-components';
import Icon from './Icon';
import NetworkQualityIndicator from './NetworkQualityIndicator';

export const Wrapper = styled.div<{
  recentlyLoud: boolean;
  videoOpacity: number;
}>`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 1);
  width: 100%;
  height: 100%;
  background: black;
  video {
    display: block;
    width: 100%;
    height: 100%;
    background: black;
    opacity: ${(props) => props.videoOpacity};
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

export const ReconnectingIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

export const StyledNetworkQualityIndicator = styled(NetworkQualityIndicator)`
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: white;
`;
