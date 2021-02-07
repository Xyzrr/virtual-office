import * as S from './RemoteUserPanel.styles';
import React from 'react';

export interface RemoteUserPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  videoTrack,
  audioTrack,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current == null) {
      return;
    }

    const stream = new MediaStream();
    if (videoTrack != null) {
      console.log('video track', videoTrack);
      stream.addTrack(videoTrack);
    }
    if (audioTrack != null) {
      console.log('audio', audioTrack);
      stream.addTrack(audioTrack);
    }
    videoRef.current.srcObject = stream;

    return () => {
      if (videoTrack != null) {
        stream.removeTrack(videoTrack);
      }
      if (audioTrack != null) {
        stream.removeTrack(audioTrack);
      }
    };
  }, [videoTrack, audioTrack]);

  return (
    <S.Wrapper className={className} ref={wrapperRef}>
      <video ref={videoRef} autoPlay></video>
    </S.Wrapper>
  );
};

export default RemoteUserPanel;
