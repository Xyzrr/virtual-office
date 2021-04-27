import styled, { css } from 'styled-components';
import * as ChatFeedStyles from './ChatFeed.styles';

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
  height: calc(100vh - 40px - 50px);
`;

export const Wrapper = styled.div<{ expanded?: boolean }>`
  position: absolute;
  padding: 16px;
  padding-top: 0;
  width: 300px;
  display: flex;
  bottom: 0;
  left: 0;
  flex-direction: column;
  height: fit-content;

  ${(props) =>
    props.expanded &&
    css`
      ${ChatFeedOuterWrapper} {
        height: calc(100vh - 40px - 50px + 128px);
      }
    `}
`;
