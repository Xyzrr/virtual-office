import styled from 'styled-components';
import { DARK_BACKGROUND } from '../constants';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column-reverse;
  height: 100%;
  overflow: auto;
  scrollbar-width: 0;
  padding: 0 16px 16px;
  background: ${DARK_BACKGROUND.alpha(0.5).toString()};
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const InnerWrapper = styled.div`
  padding-top: 16px;
`;
