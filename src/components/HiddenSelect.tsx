import * as S from './HiddenSelect.styles';
import React from 'react';

export type HiddenSelectProps = Omit<React.ComponentProps<'select'>, 'ref'>;

const HiddenSelect: React.FC<HiddenSelectProps> = React.forwardRef<
  HTMLSelectElement,
  HiddenSelectProps
>(({ onFocus, ...standardProps }, ref) => {
  return (
    <S.Wrapper
      {...standardProps}
      ref={ref}
      onFocus={(e) => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        onFocus?.(e);
      }}
    />
  );
});
export default HiddenSelect;
