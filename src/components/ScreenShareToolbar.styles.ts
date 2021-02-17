import styled, { css } from 'styled-components';
import Button from './Button';

export const Wrapper = styled.div`
  display: flex;
`;

export const StopButton = styled(Button).attrs({ color: 'danger' })``;
