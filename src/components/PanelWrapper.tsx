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
}) => {
  return (
    <S.Wrapper
      style={{
        transform: `translate(
          ${x * (xDirection === 'left' ? -1 : 1)}px,
          ${y}px
        )`,
        width,
        height,
      }}
      z={z}
      xDirection={xDirection}
    >
      <S.InnerWrapper
        className={className}
        style={{
          WebkitMaskImage:
            minY == null || y >= minY
              ? undefined
              : `linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0),
            rgba(0, 0, 0, 0) ${-y + minY - 4}px,
            rgba(0, 0, 0, 1) ${-y + minY + 4}px
          )`,
        }}
      >
        {children}
      </S.InnerWrapper>
    </S.Wrapper>
  );
};

export default PanelWrapper;
