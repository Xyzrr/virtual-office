import { Editable } from 'slate-react';
import styled, { css } from 'styled-components';
import { DARK_BACKGROUND, HIGHLIGHT } from '../constants';

export const Wrapper = styled.div`
  flex-shrink: 0;
`;

export const StyledEditable = styled(Editable)<{
  focused?: boolean;
}>`
  box-shadow: inset 0 0 0 1px #444;
  background: ${DARK_BACKGROUND.toString()};
  padding: 8px 12px;
  border-radius: 4px;
  color: #ccc;
  &:hover {
    box-shadow: inset 0 0 0 1px #666;
  }
  opacity: 1;
  margin-top: 8px;
  transition: opacity 0.2s, margin-bottom 0.2s, margin-top 0.2s;
  line-height: 20px;
  position: sticky !important;
  bottom: 0;
  ${(props) =>
    props.focused &&
    css`
      && {
        box-shadow: inset 0 0 0 1px ${HIGHLIGHT.toString()};
      }
    `}
`;
