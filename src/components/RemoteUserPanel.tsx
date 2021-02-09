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
  const [recentlyLoud, setRecentlyLoud] = React.useState(false);
  const recentlyLoudTimerRef = React.useRef<number | null>(null);

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
      console.log('volume tracked', v);
      if (v > 0.15) {
        if (recentlyLoudTimerRef.current != null) {
          window.clearTimeout(recentlyLoudTimerRef.current);
          recentlyLoudTimerRef.current = null;
        }

        setRecentlyLoud(true);

        recentlyLoudTimerRef.current = window.setTimeout(() => {
          setRecentlyLoud(false);
          recentlyLoudTimerRef.current = null;
        }, 500);
      }
    });
  }, [audioTrack]);

  return (
    <S.Wrapper className={className} recentlyLoud={recentlyLoud}>
      <video ref={videoRef} autoPlay></video>
      <S.StatusIcons>
        {!audioEnabled && <S.StatusIcon name="mic_off"></S.StatusIcon>}
      </S.StatusIcons>
    </S.Wrapper>
  );
};

export default RemoteUserPanel;
