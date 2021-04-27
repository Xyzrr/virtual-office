import { Editable } from 'slate-react';
import styled, { css } from 'styled-components';
import { HIGHLIGHT } from '../constants';

export const Wrapper = styled.div`
  flex-shrink: 0;
`;

export const StyledEditable = styled(Editable)<{ focused?: boolean }>`
  box-shadow: inset 0 0 0 1px #444;
  padding: 8px 12px;
  border-radius: 4px;
  color: #aaa;
  &:hover {
    box-shadow: inset 0 0 0 1px #666;
  }
  ${(props) =>
    props.focused &&
    css`
      && {
        box-shadow: inset 0 0 0 1px ${HIGHLIGHT.toString()};
      }
    `}
`;
