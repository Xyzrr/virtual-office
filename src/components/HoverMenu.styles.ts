import styled from 'styled-components';
import Icon from './Icon';

export const Menu = styled.div`
  display: flex;
  background: rgba(20, 20, 20, 0.8);
  border-radius: 50%;
  padding: 4px;
`;

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  ${Menu} {
    opacity: 0;
    transition: opacity 0.15s;
  }
  &:hover {
    ${Menu} {
      opacity: 1;
    }
  }
`;

export const MenuItem = styled(Icon)`
  color: white;
  cursor: pointer;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`;
