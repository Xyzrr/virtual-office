import * as S from './RemoteScreenPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import HoverMenu from './HoverMenu';

export interface RemoteScreenPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  expanded?: boolean;
  onSetExpanded(value: boolean): void;
}

const RemoteScreenPanel: React.FC<RemoteScreenPanelProps> = ({
  className,
  videoTrack,
  expanded,
  onSetExpanded,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl == null || videoTrack == null) {
      return;
    }

    const stream = new MediaStream();
    stream.addTrack(videoTrack);
    videoEl.srcObject = stream;

    return () => {
      stream.removeTrack(videoTrack);
      videoEl.srcObject = null;
    };
  }, [videoTrack]);

  return (
    <S.Wrapper className={className}>
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

export default RemoteScreenPanel;
