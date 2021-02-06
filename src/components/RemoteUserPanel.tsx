import * as S from './RemoteUserPanel.styles';
import React from 'react';
import { RemoteParticipant } from 'twilio-video';

export interface RemoteUserPanelProps {
  className?: string;
  videoElement: HTMLVideoElement | undefined;
  audioElement: HTMLAudioElement | undefined;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  videoElement,
  audioElement,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (videoElement != null) {
      wrapperRef.current?.appendChild(videoElement);
    }
  }, [videoElement]);

  React.useEffect(() => {
    if (audioElement != null) {
      wrapperRef.current?.appendChild(audioElement);
    }
  }, [audioElement]);

  return <S.Wrapper className={className} ref={wrapperRef}></S.Wrapper>;
};

export default RemoteUserPanel;
