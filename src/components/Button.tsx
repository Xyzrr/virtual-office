import * as S from './Button.styles';
import React from 'react';

export type ButtonProps = Omit<React.ComponentProps<'a'>, 'ref'> & {
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = React.forwardRef<
  HTMLAnchorElement,
  ButtonProps
>(({ variant, color, disabled, size, ...standardProps }, ref) => {
  return (
    <S.Wrapper
      {...standardProps}
      ref={ref}
      variant={variant}
      color={color}
      disabled={disabled}
      size={size}
    ></S.Wrapper>
  );
});

export default Button;
