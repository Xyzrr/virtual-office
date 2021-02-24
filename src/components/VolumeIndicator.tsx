import * as S from './VolumeIndicator.styles';
import React from 'react';

export interface VolumeIndicatorProps {
  className?: string;
  volume: number;
}

const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({
  className,
  volume,
}) => {
  return (
    <S.Wrapper className={className} volume={volume}>
      <S.CurrentVolumeWrapper style={{ height: Math.floor(volume * 200) }}>
        <S.CurrentVolume />
      </S.CurrentVolumeWrapper>
      <S.MaxVolume />
    </S.Wrapper>
  );
};

export default VolumeIndicator;
