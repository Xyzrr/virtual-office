import * as S from './WelcomePanel.styles';
import React from 'react';
import { LocalMediaContext } from './contexts/LocalMediaContext';
import Color from 'color';
import * as _ from 'lodash';
import AudioInputControl from './components/AudioInputControl';
import VideoInputControl from './components/VideoInputControl';
import { ColyseusContext } from './contexts/ColyseusContext';
import { LocalInfoContext } from './contexts/LocalInfoContext';
import Button from './components/Button';
import { useHistory } from 'react-router-dom';
import { COLOR_OPTIONS } from './components/constants';

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
  const history = useHistory();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { localVideoTrack } = React.useContext(LocalMediaContext);
  const [playerCount, setPlayerCount] = React.useState(0);
  const {
    localIdentity,
    localName,
    setLocalName,
    localColor,
    setLocalColor,
  } = React.useContext(LocalInfoContext);
  const [transitioning, setTransitioning] = React.useState(false);

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

    const onPlayerAddedOrRemoved = () => {
      // if (identity === localIdentity) {
      //   setSelectedColor(player.color);
      // }
      setPlayerCount(room.state.players.size - 1);
    };

    addListener('player-added', onPlayerAddedOrRemoved);
    addListener('player-removed', onPlayerAddedOrRemoved);

    return () => {
      removeListener('player-added', onPlayerAddedOrRemoved);
      removeListener('player-removed', onPlayerAddedOrRemoved);
    };
  }, [room]);

  React.useEffect(() => {
    setTransitioning(true);
  }, [open]);

  if (!open && !transitioning) {
    return null;
  }

  const submitDisabled = localName === '';
  console.log('ROOM', room);

  return (
    <S.Wrapper
      className={className}
      hide={!open}
      onTransitionEnd={() => {
        setTransitioning(false);
      }}
    >
      <S.Title>
        {room && (
          <>
            Ready to join <S.SpaceName>{room.state.spaceName}</S.SpaceName>?
          </>
        )}
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
        {COLOR_OPTIONS.map((c) => (
          <S.ColorOption
            key={c}
            color={new Color(c).toString()}
            selected={localColor === c}
            onClick={() => {
              setLocalColor(c);
              setLocalName;
            }}
          ></S.ColorOption>
        ))}
      </S.ColorOptions>
      <S.Label>Your name</S.Label>
      <S.Input
        autoFocus
        value={localName}
        onChange={(e) => {
          setLocalName(e.target.value);
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
          onClick={() => {
            history.push('/home');
          }}
        >
          Go back
        </S.StyledButton>
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
