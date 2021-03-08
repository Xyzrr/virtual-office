import React from 'react';
import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipant,
  DailyCallOptions,
  DailyMeetingState,
} from '@daily-co/daily-js';
import { LocalMediaContext } from './LocalMediaContext';
import { LocalInfoContext } from './LocalInfoContext';
import { useImmer } from 'use-immer';

interface CallObjectContextValue {
  callObject: DailyCall;
  meetingState: DailyMeetingState;
  localScreenShareTrulyOn: boolean;
  join(roomName: string, identity: string): Promise<void>;
  leave(): void;
}

export const CallObjectContext = React.createContext<CallObjectContextValue>(
  null!
);

interface Participant {
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
  screenVideoTrack?: MediaStreamTrack;
  screenAudioTrack?: MediaStreamTrack;
}

interface VideoCallContextValue {
  participants: {
    [identity: string]: Participant;
  };
}

export const VideoCallContext = React.createContext<VideoCallContextValue>(
  null
);

export const CallObjectContextProvider: React.FC = ({ children }) => {
  const callObject = React.useMemo(
    () =>
      DailyIframe.createCallObject({
        subscribeToTracksAutomatically: false,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      }),
    []
  );

  const [meetingState, setMeetingState] = React.useState<DailyMeetingState>(
    'new'
  );

  const [localScreenShareTrulyOn, setLocalScreenShareTrulyOn] = React.useState(
    false
  );

  const {
    localVideoInputOn,
    localVideoInputDeviceId,
    localAudioInputOn,
    localAudioInputDeviceId,
    localScreenShareOn,
    localScreenShareSourceId,
  } = React.useContext(LocalMediaContext);

  const { localIdentity, localGhost } = React.useContext(LocalInfoContext);

  const [participants, setParticipants] = useImmer<{
    [identity: string]: Participant;
  }>({});

  const join = React.useCallback(
    async (roomName: string) => {
      const options: DailyCallOptions = {
        url: `http://harbor.daily.co/${roomName}`,
      };

      // missing userName property in type definition
      (options as any).userName = localIdentity;

      const participantObject = await callObject.join(options);

      console.log('Joined Daily room', participantObject);

      callObject.setLocalAudio(localAudioInputOn);
      callObject.setLocalVideo(localVideoInputOn);

      if (process.env.LOW_POWER) {
        callObject.setBandwidth({
          trackConstraints: { width: 32, height: 18 },
        });
      }
    },
    [callObject]
  );

  const leave = React.useCallback(() => {
    callObject.leave();
  }, [callObject]);

  React.useEffect(() => {
    if (localGhost) {
      leave();
    } else {
      join('dev');
    }
  }, [localGhost, join, leave]);

  React.useEffect(() => {
    const events: DailyEvent[] = [
      'loading',
      'loaded',
      'joining-meeting',
      'joined-meeting',
      'left-meeting',
      'error',
    ];

    function handleNewMeetingState(event?: DailyEvent) {
      setMeetingState(callObject.meetingState());
    }

    handleNewMeetingState();

    for (const event of events) {
      callObject.on(event, handleNewMeetingState);
    }

    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewMeetingState);
      }
    };
  }, [callObject]);

  React.useEffect(() => {
    function handleNewParticipantsState(event?: DailyEventObjectParticipant) {
      const localParticipant = callObject.participants().local;

      if (localParticipant == null) {
        return;
      }

      setLocalScreenShareTrulyOn(localParticipant.screen);
    }

    handleNewParticipantsState();

    // Listen for changes in state
    callObject.on('participant-updated', handleNewParticipantsState);

    // Stop listening for changes in state
    return function cleanup() {
      callObject.off('participant-updated', handleNewParticipantsState);
    };
  }, [callObject]);

  React.useEffect(() => {
    callObject.setLocalVideo(localVideoInputOn);
  }, [callObject, localVideoInputOn]);

  React.useEffect(() => {
    callObject.setInputDevicesAsync({ videoDeviceId: localVideoInputDeviceId });
  }, [callObject, localVideoInputDeviceId]);

  React.useEffect(() => {
    callObject.setLocalAudio(localAudioInputOn);
  }, [callObject, localAudioInputOn]);

  React.useEffect(() => {
    callObject.setInputDevicesAsync({ audioDeviceId: localAudioInputDeviceId });
  }, [callObject, localAudioInputDeviceId]);

  React.useEffect(() => {
    if (localScreenShareOn) {
      callObject.startScreenShare({
        chromeMediaSourceId: localScreenShareSourceId,
      });
    } else {
      callObject.stopScreenShare();
    }
  }, [callObject, localScreenShareOn, localScreenShareSourceId]);

  /**
   * Start listening for participant changes, when the callObject is set.
   */
  React.useEffect(() => {
    const events: DailyEvent[] = [
      'participant-joined',
      'participant-updated',
      'participant-left',
    ];

    function handleNewParticipantsState(event: DailyEvent) {
      setParticipants((draft) => {
        const newParts = callObject.participants();

        Object.entries(newParts).forEach(([identity, participant]) => {
          draft[identity] = {
            audioTrack: participant.audioTrack,
            videoTrack: participant.videoTrack,
            screenAudioTrack: participant.screenAudioTrack,
            screenVideoTrack: participant.screenVideoTrack,
          };
        });

        Object.entries(draft).forEach(([identity, p]) => {
          if (!newParts[identity]) {
            delete draft[identity];
          }
        });
      });
    }

    // Listen for changes in state
    for (const event of events) {
      callObject.on(event, handleNewParticipantsState);
    }

    // Stop listening for changes in state
    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewParticipantsState);
      }
    };
  }, [callObject]);

  // React.useEffect(() => {
  //   if (
  //     distance != null &&
  //     distance <= MAX_INTERACTION_DISTANCE &&
  //     ap.sid != null
  //   ) {
  //     callObject?.updateParticipant(ap.sid, {
  //       setSubscribedTracks: true,
  //     });
  //   }

  //   if (
  //     distance != null &&
  //     distance > MAX_INTERACTION_DISTANCE &&
  //     ap.sid != null
  //   ) {
  //     callObject?.updateParticipant(ap.sid, {
  //       setSubscribedTracks: false,
  //     });
  //   }
  // });

  return (
    <CallObjectContext.Provider
      value={{ callObject, join, meetingState, leave, localScreenShareTrulyOn }}
    >
      <VideoCallContext.Provider value={{ participants }}>
        {children}
      </VideoCallContext.Provider>
    </CallObjectContext.Provider>
  );
};
