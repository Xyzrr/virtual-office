import * as S from './RemoteUserPanel.styles';
import React from 'react';
import {
  RemoteParticipant,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from 'twilio-video';

export interface RemoteUserPanelProps {
  className?: string;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  videoTrack,
  audioTrack,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (videoTrack != null) {
      const el = videoTrack.attach();
      wrapperRef.current?.appendChild(el);
      return () => {
        el.remove();
      };
    }
  }, [videoTrack]);

  React.useEffect(() => {
    if (audioTrack != null) {
      const el = audioTrack.attach();
      wrapperRef.current?.appendChild(el);
      return () => {
        el.remove();
      };
    }
  }, [audioTrack]);

  return <S.Wrapper className={className} ref={wrapperRef}></S.Wrapper>;
};

export default RemoteUserPanel;
