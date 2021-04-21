import * as S from './FakeMacOSFrame.styles';
import React from 'react';

export interface FakeMacOSFrameProps {
  className?: string;
}

const FakeMacOSFrame: React.FC<FakeMacOSFrameProps> = ({ className }) => {
  if (process.platform !== 'darwin') {
    return null;
  }

  return <S.Wrapper className={className}></S.Wrapper>;
};

export default FakeMacOSFrame;
