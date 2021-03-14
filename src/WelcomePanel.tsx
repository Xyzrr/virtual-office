import * as S from './WelcomePanel.styles';
import React from 'react';
import { LocalMediaContext } from './contexts/LocalMediaContext';
import Color from 'color';
import * as _ from 'lodash';
import AudioInputControl from './components/AudioInputControl';
import VideoInputControl from './components/VideoInputControl';
import { ColyseusContext } from './contexts/ColyseusContext';
import { LocalInfoContext } from './contexts/LocalInfoContext';

const COLORS = [
  0xe6194b,
  0xf58231,
  0xffe119,
  0xfffac8,
  0xaaffc3,
  0xbcf60c,
  0xe6beff,
  0x46f0f0,
  0xf032e6,
  0x911eb4,

  0x3cb44b,
  0x008080,
  0x4363d8,
  0xfabebe,
  0x9a6324,
  0x808000,
  0xffd8b1,
  0x808080,
  0x800000,
  0x000075,
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
  const [playerCount, setPlayerCount] = React.useState(0);
  const { localIdentity, name, setName } = React.useContext(LocalInfoContext);

  const [selectedColor, setSelectedColor] = React.useState<number>();

  const { addListener, removeListener, room } = React.useContext(
    ColyseusContext
  );

  React.useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
    }
  }, [localVideoTrack]);

  React.useEffect(() => {
    if (!room) {
      return;
    }

    const onPlayerAddedOrRemoved = ({ identity, player }: any) => {
      if (identity === localIdentity) {
        setSelectedColor(player.color);
      }
      setPlayerCount(room.state.players.size - 1);
    };

    addListener('player-added', onPlayerAddedOrRemoved);
    addListener('player-removed', onPlayerAddedOrRemoved);

    return () => {
      removeListener('player-added', onPlayerAddedOrRemoved);
      removeListener('player-removed', onPlayerAddedOrRemoved);
    };
  }, [room]);

  const submitDisabled = name === '';

  return (
    <S.Wrapper className={className} hide={!open}>
      <S.Title>
        Ready to join <strong>Harbor</strong>?
      </S.Title>
      <S.Subtitle>
        {playerCount > 0 && <S.GreenDot />}
        {playerCount === 0
          ? 'No users'
          : playerCount === 1
          ? '1 user'
          : `${playerCount} users`}{' '}
        currently online
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
            key={c}
            color={new Color(c).toString()}
            selected={selectedColor === c}
            onClick={() => {
              setSelectedColor(c);
              room?.send('updatePlayer', { color: c });
            }}
          ></S.ColorOption>
        ))}
      </S.ColorOptions>
      <S.Label>Your name</S.Label>
      <S.Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          room?.send('updatePlayer', { name: e.target.value });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !submitDisabled) {
            onJoin?.();
            e.currentTarget.blur();
          }
        }}
      ></S.Input>
      <S.Buttons>
        <S.StyledButton
          color="primary"
          variant="contained"
          onClick={onJoin}
          disabled={submitDisabled}
        >
          Join now
        </S.StyledButton>
        {/* <S.StyledButton>Cancel</S.StyledButton> */}
      </S.Buttons>
    </S.Wrapper>
  );
};

export default WelcomePanel;
