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
    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        console.log('track already subscribed');
        const track = publication.track;
        if (track != null && track.kind !== 'data') {
          const el = track.attach();
          wrapperRef.current?.appendChild(el);
          publication.on('unsubscribed', () => {
            console.log('publication unsubscribed');
            // el.remove();
          });
        }
      }
    });

    participant.on('trackSubscribed', (track: any) => {
      console.log('track subscribed');
      const el = track.attach();
      wrapperRef.current?.appendChild(el);
    });

    participant.on('trackUnsubscribed', (track: any) => {
      console.log('track unsubscribed');
      const els = track.detach();
      els.forEach((el: any) => el.remove());
    });
  }, [participant]);

  return <S.Wrapper className={className} ref={wrapperRef}></S.Wrapper>;
};

export default RemoteUserPanel;
