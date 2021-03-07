import styled, { css } from 'styled-components';
import * as IconButtonStyles from './IconButton.styles';

export const Wrapper = styled.div<{
  minimized?: boolean;
  hide?: boolean;
}>`
  pointer-events: none;
  display: flex;
  position: absolute;
  bottom: 16px;
  width: 100%;
  justify-content: center;
  z-index: 2;

  transition: opacity 0.2s, transform 0.2s;
  ${(props) =>
    props.hide &&
    css`
      opacity: 0;
      transform: translateY(12px);
    `}

  ${(props) =>
    props.minimized &&
    css`
      top: 108px;
      bottom: auto;

      ${props.hide &&
      css`
        transform: translateY(6px);
      `}

      ${IconButtonStyles.IconButton} {
        margin-right: 8px;
        width: 28px;
        height: 28px;
        .material-icons-outlined {
          font-size: 18px;
        }
      }
    `}
`;
