import * as S from './NetworkQualityIndicator.styles';
import React from 'react';

export interface NetworkQualityIndicatorProps {
  className?: string;
  networkQuality: number;
}

const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({
  className,
  networkQuality,
}) => {
  return (
    <S.Wrapper className={className}>
      <S.CurrentSignal networkQuality={networkQuality} />
      <S.MaxSignal />
    </S.Wrapper>
  );
};

export default NetworkQualityIndicator;
