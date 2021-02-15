import * as S from './Button.styles';
import React from 'react';

export type ButtonProps = Omit<React.ComponentProps<'button'>, 'ref'> & {
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'secondary';
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ variant, color, disabled, ...standardProps }, ref) => {
  return (
    <S.Wrapper
      {...standardProps}
      ref={ref}
      variant={variant}
      color={color}
      disabled={disabled}
    ></S.Wrapper>
  );
});

export default Button;
