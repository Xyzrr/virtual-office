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
      <S.CurrentVolumeWrapper>
        <S.CurrentVolume volume={volume} />
      </S.CurrentVolumeWrapper>
      <S.MaxVolume />
    </S.Wrapper>
  );
};

export default VolumeIndicator;
