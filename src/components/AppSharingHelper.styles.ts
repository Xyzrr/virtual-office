import styled from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled(Icon).attrs({ name: 'apps_outlined' })`
  color: white;
  color: orange;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px;
  font-size: 20px;
  width: 24px;
  flex-grow: 0;
  border-radius: 4px;
  user-select: none;
  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
`;
