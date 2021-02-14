import * as S from './LocalUserPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import { useVolume } from '../util/useVolume';
import HoverMenu from './HoverMenu';

export interface LocalUserPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  expanded?: boolean;
  onSetExpanded(value: boolean): void;
}

const LocalUserPanel: React.FC<LocalUserPanelProps> = ({
  className,
  videoTrack,
  audioTrack,
  expanded,
  onSetExpanded,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [recentlyLoud, setRecentlyLoud] = React.useState(false);
  const recentlyLoudTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (videoRef.current == null) {
      return;
    }

    const stream = new MediaStream();

    if (videoTrack != null) {
      stream.addTrack(videoTrack);
    }

    videoRef.current.srcObject = stream;

    return () => {
      if (videoTrack != null) {
        stream.removeTrack(videoTrack);
      }
    };
  }, [videoTrack]);

  useVolume(audioTrack, (v) => {
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

  return (
    <S.Wrapper className={className} recentlyLoud={recentlyLoud}>
      <video ref={videoRef} autoPlay></video>
      <HoverMenu>
        <HoverMenuStyles.MenuItem
          name={expanded ? 'fullscreen_exit' : 'fullscreen'}
          onClick={() => {
            onSetExpanded(!expanded);
          }}
        ></HoverMenuStyles.MenuItem>
      </HoverMenu>
    </S.Wrapper>
  );
};

export default LocalUserPanel;
