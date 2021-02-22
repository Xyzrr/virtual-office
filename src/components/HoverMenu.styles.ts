import styled, { css } from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div<{ hidden?: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  background: rgba(20, 20, 20, 0.9);
  border-radius: 50%;
  padding: 4px;

  transition: opacity 0.2s;
  ${(props) =>
    props.hidden &&
    css`
      opacity: 0;
    `}
`;

export const MenuItem = styled(Icon)`
  color: white;
  cursor: pointer;
  opacity: 0.5;
  font-size: 28px;
  &:hover {
    opacity: 1;
  }
`;
