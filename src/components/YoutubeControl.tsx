import * as S from './YoutubeControl.styles';
import * as IconButtonStyles from './IconButton.styles';
import React from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import circleButtonWithOptions from '../masks/circleButtonWithOptions.svg';
import VolumeIndicator from './VolumeIndicator';
import HiddenSelect from './HiddenSelect';

export interface YoutubeControlProps {
  className?: string;
  minimized?: boolean;
}

const YoutubeControl: React.FC<YoutubeControlProps> = ({
  className,
  minimized,
}) => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    
  }, []);

  return (
    <IconButtonStyles.IconButton
      className={className}
      color={undefined}
    >
      <IconButtonStyles.IconButtonBackground
        onClick={() => {
          setModalOpen(!modalOpen)
        }}
      />
      <IconButtonStyles.IconButtonIcon name="playlist_play"></IconButtonStyles.IconButtonIcon>
      {modalOpen && (
        <S.PlaylistWrapper>
          <S.TopBar>YouTube Playlist</S.TopBar>
          <S.VideoInput
            ref={videoInputRef}
           ></S.VideoInput>
          <S.AddButton
            onClick={() => {
              console.log(videoInputRef.current.value)
            }}
          >Add Video</S.AddButton>
        </S.PlaylistWrapper>
      )}
    </IconButtonStyles.IconButton>
  );
};

export default YoutubeControl;
