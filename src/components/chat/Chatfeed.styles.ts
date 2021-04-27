import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column-reverse;
  overflow: auto;
  flex-grow: 1;
  scrollbar-width: 0;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const InnerWrapper = styled.div`
  padding-top: 16px;
`;
