import styled, { css } from 'styled-components';
import Color from 'color';

export const Wrapper = styled.button<{
  variant?: string;
  color?: string;
  disabled?: boolean;
}>`
  outline: none;
  border: none;
  border-radius: 4px;
  background: none;
  color: white;
  padding: 6px 10px;
  font-size: 16px;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  ${(props) => {
    const color =
      props.color === 'primary'
        ? new Color('#1b95e0')
        : props.color === 'danger'
        ? new Color('rgb(234, 71, 81')
        : new Color('#ccc');

    if (props.variant === 'contained') {
      return css`
        background: ${color.string()};
        &:hover {
          background: ${color.lighten(0.1).string()};
        }
      `;
    }
    if (props.variant === 'outlined') {
      return css`
        outline: 1px solid ${color.string()};
      `;
    }
    return css`
      color: ${color.string()};
    `;
  }}

  ${(props) =>
    props.disabled &&
    css`
      pointer-events: none;
      background: #777;
      opacity: 0.6;
    `}
`;
