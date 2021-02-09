import * as S from './RemoteUserPanel.styles';
import React from 'react';
import { trackVolume } from '../util/trackVolume';

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
  const [volume, setVolume] = React.useState(0);

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

  React.useEffect(() => {
    if (audioTrack == null) {
      return;
    }

    trackVolume(audioTrack, (v) => {
      setVolume(v);
    });
  }, [audioTrack]);

  return (
    <S.Wrapper className={className} volume={volume}>
      <video ref={videoRef} autoPlay></video>
      <S.StatusIcons>
        {!audioEnabled && <S.StatusIcon name="mic_off"></S.StatusIcon>}
      </S.StatusIcons>
    </S.Wrapper>
  );
};

export default RemoteUserPanel;
