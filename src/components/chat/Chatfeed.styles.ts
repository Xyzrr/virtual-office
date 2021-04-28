import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column-reverse;
  height: 100%;
  overflow: auto;
  scrollbar-width: 0;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const InnerWrapper = styled.div`
  padding-top: 16px;
`;
