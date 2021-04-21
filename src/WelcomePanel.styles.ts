import styled, { css } from 'styled-components';
import {
  HIGHLIGHT,
  LIGHT_BACKGROUND,
  DARK_BACKGROUND,
} from './components/constants';
import Button from './components/Button';

export const Wrapper = styled.div<{ hide?: boolean }>`
  position: absolute;
  top: 0;
  left: 0px;
  width: 400px;
  height: 100%;
  background: #2f2f2f;
  padding: 32px;
  -webkit-app-region: drag;
  overflow: auto;

  transition: left 0.2s;
  ${(props) =>
    props.hide &&
    css`
      left: -400px;
    `}
`;

export const Title = styled.div`
  color: white;
  font-size: 32px;
  margin-top: 16px;
  margin-bottom: 4px;
`;

export const GreenDot = styled.div`
  background: ${HIGHLIGHT.toString()};
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
  margin-left: 8px;
`;

export const Subtitle = styled.div`
  font-size: 14px;
  color: #ccc;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
`;

export const VideoWrapper = styled.div`
  video {
    width: 100%;
    height: 100%;
    transform: scale(-1, 1);
  }
  overflow: hidden;
  border-radius: 4px;
  height: 189px;
  margin-bottom: 32px;
  position: relative;
  background: black;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  -webkit-app-region: no-drag;
`;

export const InputToolbar = styled.div`
  position: absolute;
  bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transform: scale(0.8);
`;

export const Label = styled.div`
  font-size: 14px;
  color: #ccc;
  margin-bottom: 12px;
`;

export const ColorOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  -webkit-app-region: no-drag;
`;

export const ColorOption = styled.div<{ color: string; selected?: boolean }>`
  width: 20px;
  height: 20px;
  background: ${(props) => props.color};
  margin-right: 12px;
  margin-bottom: 12px;
  border-radius: 4px;
  ${(props) =>
    props.selected &&
    css`
      border: 2px solid white;
    `}
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  background: ${DARK_BACKGROUND.toString()};
  border: 1px solid #444;
  border-radius: 4px;
  outline: none;
  color: white;
  &:focus {
    border: 1px solid ${HIGHLIGHT.toString()};
  }
  margin-bottom: 32px;
  -webkit-app-region: no-drag;
`;

export const Buttons = styled.div`
  display: flex;
`;

export const StyledButton = styled(Button)`
  margin-right: 8px;
`;
