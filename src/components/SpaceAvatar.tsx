import * as S from './SpaceAvatar.styles';
import React from 'react';
import { initials } from '../util/text';

export interface SpaceAvatarProps {
  className?: string;
  photoUrl?: string;
  spaceName?: string;
}

const SpaceAvatar: React.FC<SpaceAvatarProps> = ({
  className,
  photoUrl,
  spaceName,
}) => {
  return (
    <S.Wrapper className={className}>
      {photoUrl ? (
        <S.AvatarImage src={photoUrl} />
      ) : (
        spaceName && initials(spaceName)
      )}
    </S.Wrapper>
  );
};

export default SpaceAvatar;
