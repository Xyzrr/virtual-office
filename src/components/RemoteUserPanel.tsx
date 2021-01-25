import * as S from './RemoteUserPanel.styles';
import React from 'react';
import { RemoteParticipant } from 'twilio-video';

export interface RemoteUserPanelProps {
  className?: string;
  participant: RemoteParticipant;
}

const RemoteUserPanel: React.FC<RemoteUserPanelProps> = ({
  className,
  participant,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed) {
        const track = publication.track;
        wrapperRef.current?.appendChild(track.attach());
      }
    });
    participant.on('trackSubscribed', (track: any) => {
      wrapperRef.current?.appendChild(track.attach());
    });
  }, [participant]);

  return <S.Wrapper className={className} ref={wrapperRef}></S.Wrapper>;
};

export default RemoteUserPanel;
