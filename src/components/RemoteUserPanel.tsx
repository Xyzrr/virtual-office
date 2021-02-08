import * as S from './RemoteUserPanel.styles';
import React from 'react';

export interface RemoteUserPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  audioEnabled: boolean;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  videoTrack,
  audioTrack,
  audioEnabled,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  console.log('audio enabled', audioEnabled);

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
    <S.Wrapper className={className}>
      <video ref={videoRef} autoPlay></video>
    </S.Wrapper>
  );
};

export default RemoteUserPanel;
