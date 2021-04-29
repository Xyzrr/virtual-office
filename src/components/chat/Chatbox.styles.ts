import { ProxyTypeSet } from 'immer/dist/internal';
import styled, { css } from 'styled-components';
import { DARK_BACKGROUND } from '../constants';
import * as ChatInputStyles from './ChatInput.styles';

export const ChatFeedOuterWrapper = styled.div`
  height: 160px;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
  transition: height 0.2s;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 1) 128px
  );
`;

export const ChatFeedInnerWrapper = styled.div`
  height: calc(100vh - 40px);
`;

export const Wrapper = styled.div<{ expanded?: boolean; hideInput?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 300px;
  height: ${(props) => 280 - (props.hideInput ? 44 : 0)}px;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
  transition: height 0.2s;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 1) 128px
  );

  &:hover {
    height: 300px;
  }

  ${(props) =>
    props.expanded &&
    css`
      && {
        height: calc(100vh - 40px + 128px);
      }
    `}

  ${(props) =>
    props.hideInput &&
    css`
      ${ChatInputStyles.StyledEditable} {
        opacity: 0;
        margin-bottom: -36px;
        margin-top: 0;
      }
    `}
`;
