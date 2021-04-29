import styled, { css } from 'styled-components';

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

export const Wrapper = styled.div<{ expanded?: boolean }>`
  position: absolute;
  padding: 0 16px 16px;
  bottom: 0;
  left: 0;
  width: 300px;
  height: 220px;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
  transition: height 0.2s;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 1) 128px
  );

  ${(props) =>
    props.expanded &&
    css`
      height: calc(100vh - 40px + 128px);
    `}
`;