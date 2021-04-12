import styled from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div``;

export const PlaceholderIcon = styled(Icon).attrs({ name: 'apps_outlined' })`
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

export const PopupContent = styled.div`
  width: 280px;
  padding: 16px;
  background: white;

  h3 {
    margin-top: 4px;
    margin-bottom: 12px;
  }

  p {
    color: #999;
    margin-top: 0;
    font-size: 16px;
    margin-bottom: 16px;
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;
