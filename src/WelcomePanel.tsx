import * as S from './WelcomePanel.styles';
import React from 'react';
import { LocalMediaContext } from './contexts/LocalMediaContext';

export interface WelcomePanelProps {
  className?: string;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({ className }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { localVideoTrack } = React.useContext(LocalMediaContext);

  React.useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
    }
  }, [localVideoTrack]);

  return (
    <S.Wrapper className={className}>
      <S.Title>
        Ready to join <strong>Harbor</strong>?
      </S.Title>
      {localVideoTrack && <video ref={videoRef} autoPlay></video>}
      <S.Label>Your color</S.Label>
      <S.Label>Your name</S.Label>
    </S.Wrapper>
  );
};

export default WelcomePanel;
