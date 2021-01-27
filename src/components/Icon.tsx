import * as S from './Icon.styles';
import React from 'react';
import classNames from 'classnames';

export type IconProps = Omit<React.ComponentProps<'i'>, 'ref'> & {
  name: string;
};

const Icon = React.forwardRef<HTMLDivElement, IconProps>(
  ({ name, className, ...standardProps }, ref) => {
    return (
      <S.Wrapper
        {...standardProps}
        ref={ref}
        className={classNames(`material-icons`, className)}
      >
        {name}
      </S.Wrapper>
    );
  }
);
export default Icon;
