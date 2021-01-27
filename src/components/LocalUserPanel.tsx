import * as S from './LocalUserPanel.styles';
import React from 'react';
import { LocalParticipant } from 'twilio-video';

export interface LocalUserPanelProps {
  className?: string;
  participant: LocalParticipant;
}

const LocalUserPanel: React.FC<LocalUserPanelProps> = ({
  className,
  participant,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    participant.videoTracks.forEach((publication) => {
      const track = publication.track;
      wrapperRef.current?.appendChild((track as any).attach());
    });

    participant.on('trackPublished', (publication: any) => {
      const { track } = publication;
      if (track.kind === 'video') {
        console.log('local track published');
        const el = track.attach();
        wrapperRef.current?.appendChild(el);
      }
    });

    participant.on('trackStopped', (track: any) => {
      if (track.kind === 'video') {
        console.log('local track stopped', track);
        const els = track.detach();
        els.forEach((el: any) => el.remove());
      }
    });
  }, [participant]);

  return <S.Wrapper className={className} ref={wrapperRef}></S.Wrapper>;
};

export default LocalUserPanel;
