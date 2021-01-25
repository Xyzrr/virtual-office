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
    participant.tracks.forEach((publication) => {
      const track = publication.track;
      wrapperRef.current?.appendChild((track as any).attach());
    });
  }, [participant]);

  return <S.Wrapper className={className} ref={wrapperRef}></S.Wrapper>;
};

export default LocalUserPanel;
