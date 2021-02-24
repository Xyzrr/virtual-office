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
      className={className}
      x={x}
      y={y}
      z={z}
      width={width}
      height={height}
      xDirection={xDirection}
      minY={minY}
    >
      {children}
    </S.Wrapper>
  );
};

export default PanelWrapper;
