import * as S from './LocalUserPanel.styles';
import React from 'react';

export interface LocalUserPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
}

const LocalUserPanel: React.FC<LocalUserPanelProps> = ({
  className,
  videoTrack,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current == null) {
      return;
    }

    const stream = new MediaStream();

    if (videoTrack != null) {
      stream.addTrack(videoTrack);
    }

    videoRef.current.srcObject = stream;

    return () => {
      if (videoTrack != null) {
        stream.removeTrack(videoTrack);
      }
    };
  }, [videoTrack]);

  return (
    <S.Wrapper className={className}>
      <video ref={videoRef} autoPlay></video>
    </S.Wrapper>
  );
};

export default LocalUserPanel;
