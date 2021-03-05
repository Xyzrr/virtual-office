import * as S from './PanelWrapper.styles';
import React from 'react';

export interface PanelWrapperProps {
  className?: string;
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  xDirection: 'left' | 'right';
  minY?: number;
  floating?: boolean;
}

const PanelWrapper: React.FC<PanelWrapperProps> = ({
  className,
  x,
  y,
  z,
  width,
  height,
  xDirection,
  minY,
  children,
  floating,
}) => {
  return (
    <S.Wrapper
      style={{
        transform: `translate(
          ${(x - 8) * (xDirection === 'left' ? -1 : 1)}px,
          ${y - 8}px
        )`,
        width: width + 16,
        height: height + 16,
        WebkitMaskImage:
          minY == null || y >= minY
            ? undefined
            : `linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0),
            rgba(0, 0, 0, 0) ${-y + minY - 4 + 8}px,
            rgba(0, 0, 0, 1) ${-y + minY + 4 + 8}px
          )`,
      }}
      z={z}
      xDirection={xDirection}
      floating={floating}
    >
      <S.InnerWrapper className={className}>{children}</S.InnerWrapper>
    </S.Wrapper>
  );
};

export default PanelWrapper;
