import * as S from './FakeMacOSFrame.styles';
import React from 'react';
import os from 'os';

export interface FakeMacOSFrameProps {
  className?: string;
}

const FakeMacOSFrame: React.FC<FakeMacOSFrameProps> = ({ className }) => {
  console.log('PROCESS VER', process.version);
  if (process.platform !== 'darwin') {
    return null;
  }

  return (
    <S.Wrapper
      className={className}
      bigSur={os.version().startsWith('20.')}
    ></S.Wrapper>
  );
};

export default FakeMacOSFrame;
