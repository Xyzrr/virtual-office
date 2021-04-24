import styled, { css } from 'styled-components';
import Button from './Button';
import Icon from './Icon';

export const PlaceholderIcon = styled(Icon).attrs({ name: 'apps_outlined' })`
  color: #ffa58c;
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
    font-size: 16px;
    font-weight: 600;
  }

  p {
    color: #999;
    margin-top: 0;
    font-size: 14px;
    margin-bottom: 16px;
    &:last-child {
      margin-bottom: 8px;
    }
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const ActionButton = styled(Button)`
  &:not(:last-child) {
    margin-right: 8px;
  }
`;

export const Wrapper = styled.div<{ open?: boolean }>`
  ${(props) =>
    props.open &&
    css`
      ${PlaceholderIcon} {
        background: rgba(0, 0, 0, 0.6);
      }
    `}
`;
