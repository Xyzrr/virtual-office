import * as S from './PanelWrapper.styles';
import React from 'react';

export interface PanelWrapperProps {
  className?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  small?: boolean;
  xDirection: 'left' | 'right';
  minY?: number;
}

const PanelWrapper: React.FC<PanelWrapperProps> = ({
  className,
  x,
  y,
  width,
  height,
  small,
  xDirection,
  minY,
  children,
}) => {
  return (
    <S.Wrapper
      className={className}
      x={x}
      y={y}
      width={width}
      height={height}
      small={small}
      xDirection={xDirection}
      minY={minY}
    >
      {children}
    </S.Wrapper>
  );
};

export default PanelWrapper;
