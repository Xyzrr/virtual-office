import * as S from './RemoteScreenPanel.styles';
import * as HoverMenuStyles from './HoverMenu.styles';

import React from 'react';
import HoverMenu from './HoverMenu';
import { MAX_INTERACTION_DISTANCE } from './constants';

export interface RemoteScreenPanelProps {
  className?: string;
  videoTrack?: MediaStreamTrack;
  distance: number;
  small?: boolean;
  onSetExpanded(value: boolean): void;
}

const RemoteScreenPanel: React.FC<RemoteScreenPanelProps> = ({
  className,
  videoTrack,
  distance,
  small,
  onSetExpanded,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const videoOpacity = small
    ? 1
    : Math.min(
        1,
        (2 * (MAX_INTERACTION_DISTANCE - distance)) / MAX_INTERACTION_DISTANCE
      );

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
    <S.Wrapper className={className} videoOpacity={videoOpacity}>
      <video ref={videoRef} autoPlay></video>
      <HoverMenu>
        <HoverMenuStyles.MenuItem
          name={small ? 'fullscreen' : 'fullscreen_exit'}
          onClick={() => {
            onSetExpanded(!!small);
          }}
        ></HoverMenuStyles.MenuItem>
      </HoverMenu>
    </S.Wrapper>
  );
};

export default RemoteScreenPanel;
