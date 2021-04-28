import { Editable } from 'slate-react';
import styled, { css } from 'styled-components';
import { HIGHLIGHT } from '../constants';

export const Wrapper = styled.div`
  flex-shrink: 0;
`;

export const StyledEditable = styled(Editable)<{
  focused?: boolean;
  hide?: boolean;
}>`
  box-shadow: inset 0 0 0 1px #444;
  padding: 8px 12px;
  border-radius: 4px;
  color: #ccc;
  &:hover {
    box-shadow: inset 0 0 0 1px #666;
  }
  opacity: 1;
  margin-bottom: 16px;
  transition: opacity 0.2s, margin-bottom 0.2s;
  line-height: 20px;
  ${(props) =>
    props.focused &&
    css`
      && {
        box-shadow: inset 0 0 0 1px ${HIGHLIGHT.toString()};
      }
    `}
  ${(props) =>
    props.hide &&
    css`
      opacity: 0;
      margin-bottom: -28px;
    `}
`;
