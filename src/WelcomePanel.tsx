import * as S from './WelcomePanel.styles';
import React from 'react';
import { LocalMediaContext } from './contexts/LocalMediaContext';
import Color from 'color';
import Button from './components/Button';
import * as _ from 'lodash';
import AudioInputControl from './components/AudioInputControl';
import VideoInputControl from './components/VideoInputControl';

const COLORS = [
  0xe6194b,
  0x3cb44b,
  0xffe119,
  0x4363d8,
  0xf58231,
  0x911eb4,
  0x46f0f0,
  0xf032e6,
  0xbcf60c,
  0xfabebe,
  0x008080,
  0xe6beff,
  0x9a6324,
  0xfffac8,
  0x800000,
  0xaaffc3,
  0x808000,
  0xffd8b1,
  0x000075,
  0x808080,
];

export interface WelcomePanelProps {
  className?: string;
  open?: boolean;
  onJoin?(): void;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  className,
  open,
  onJoin,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { localVideoTrack } = React.useContext(LocalMediaContext);

  const [selectedColor, setSelectedColor] = React.useState(_.sample(COLORS));

  React.useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
    }
  }, [localVideoTrack]);

  return (
    <S.Wrapper className={className} hide={!open}>
      <S.Title>
        Ready to join <strong>Harbor</strong>?
      </S.Title>
      <S.Subtitle>
        <S.GreenDot></S.GreenDot>4 users currently online
      </S.Subtitle>
      <S.VideoWrapper>
        {localVideoTrack && <video ref={videoRef} autoPlay></video>}
        <S.InputToolbar>
          <AudioInputControl />
          <VideoInputControl />
        </S.InputToolbar>
      </S.VideoWrapper>
      <S.Label>Your color</S.Label>
      <S.ColorOptions>
        {COLORS.map((c) => (
          <S.ColorOption
            color={new Color(c).toString()}
            selected={selectedColor === c}
            onClick={() => {
              setSelectedColor(c);
            }}
          ></S.ColorOption>
        ))}
      </S.ColorOptions>
      <S.Label>Your name</S.Label>
      <S.Input></S.Input>
      <S.Buttons>
        <S.StyledButton color="primary" variant="contained" onClick={onJoin}>
          Join now
        </S.StyledButton>
        {/* <S.StyledButton>Cancel</S.StyledButton> */}
      </S.Buttons>
    </S.Wrapper>
  );
};

export default WelcomePanel;
