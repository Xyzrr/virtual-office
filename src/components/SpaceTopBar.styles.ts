import styled, { css } from 'styled-components';
import { LIGHT_BACKGROUND, DANGER } from './constants';
import Icon from './Icon';

export const Wrapper = styled.div<{ focused?: boolean; hide?: boolean }>`
  user-select: none;
  flex-grow: 0;
  height: 40px;
  background: ${(props) =>
    props.focused
      ? LIGHT_BACKGROUND.alpha(0.75).toString()
      : LIGHT_BACKGROUND.alpha(0.65).toString()};
  backdrop-filter: blur(4px);
  -webkit-app-region: drag;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 3;
  transition: margin-top 0.2s 0.4s;
  ${(props) =>
    props.hide &&
    css`
      margin-top: -40px;
    `}
`;

export const TabIcon = styled(Icon)`
  color: #bbb;
  font-size: 16px;
  margin-right: 4px;
`;

export const Tab = styled.div<{ selected?: boolean; iconOnly?: boolean }>`
  -webkit-app-region: no-drag;
  padding: 6px 12px;
  margin: 2px;
  color: #ccc;
  font-size: 13px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  ${(props) =>
    props.iconOnly &&
    css`
      padding: 6px;
      ${TabIcon} {
        margin: 0;
      }
    `}

  ${(props) =>
    props.selected &&
    css`
      background: rgba(255, 255, 255, 0.15) !important;
      color: white;
    `}
`;

export const LeftButtons = styled.div`
  ${process.platform === 'darwin' &&
  css`
    margin-left: 78px;
  `}
`;

export const ExitButton = styled(Icon)`
  background: ${DANGER.toString()};
  color: white;
  transform: rotate(180deg);
  border-radius: 4px;
  font-size: 15px;
  padding: 5px;
  &:hover {
    background: rgb(255, 80, 100);
  }
`;

export const MiddleButtons = styled.div`
  display: flex;
  align-items: center;
  margin-left: 24px;
`;

export const RightButtons = styled.div`
  display: flex;
  margin-right: 8px;
`;
