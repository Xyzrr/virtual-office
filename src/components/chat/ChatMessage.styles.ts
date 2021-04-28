import { Editable } from 'slate-react';
import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ mergeWithAbove?: boolean }>`
  padding: 8px 12px;
  color: white;
  ${(props) =>
    props.mergeWithAbove &&
    css`
      padding-top: 0;
    `}
`;

export const MessageSignature = styled.div`
  margin-bottom: 4px;
  display: flex;
  align-items: flex-end;
`;

export const SenderName = styled.div`
  color: #999;
  font-size: 13px;
  font-weight: 600;
  margin-right: 8px;
`;

export const SentAt = styled.div`
  font-size: 12px;
  color: #777;
`;

export const Message = styled(Editable)`
  color: #ccc;
  line-height: 20px;
`;
