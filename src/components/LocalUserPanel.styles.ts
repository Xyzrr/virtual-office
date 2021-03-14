import styled, { css } from 'styled-components';
import { DARK_BACKGROUND } from './constants';
import PanelWrapper from './PanelWrapper';
import Icon from './Icon';

export const LocalUserPanelWrapper = styled(PanelWrapper)``;

export const Wrapper = styled.div<{ recentlyLoud: boolean; noVideo?: boolean }>`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 0);
  width: 100%;
  height: 100%;
  background: ${DARK_BACKGROUND.toString()};
  video {
    display: block;
    transform: scale(-1, 1);
    width: 100%;
    height: 100%;
  }
  ${(props) =>
    props.recentlyLoud &&
    css`
      box-shadow: 0 0 0 2px rgba(0, 255, 0, 1);
    `}
  ${(props) =>
    props.noVideo &&
    css`
      background: ${DARK_BACKGROUND.lighten(0.5).toString()};
    `}
`;

export const StatusIcons = styled.div`
  display: flex;
`;

export const StatusIcon = styled(Icon)`
  padding: 4px;
  color: red;
`;

export const Name = styled.span`
  color: white;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  font-size: 13px;
  opacity: 0.7;
  white-space: nowrap;
`;

export const InfoBarLeft = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 12px);
  width: 100%;
`;

export const InfoBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  padding: 4px;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
`;
