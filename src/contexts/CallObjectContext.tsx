import React from 'react';
import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipant,
  DailyCallOptions,
  DailyMeetingState,
} from '@daily-co/daily-js';
import { LocalMediaContext } from './LocalMediaContext';

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

  const join = React.useCallback(
    async (roomName: string, identity: string) => {
      const options: DailyCallOptions = {
        url: `http://harbor.daily.co/${roomName}`,
        showLocalVideo: localVideoInputOn,
      };

      // missing userName property in type definition
      (options as any).userName = identity;

      const participantObject = await callObject.join(options);

      console.log('Joined Daily room', participantObject);

      if (!localAudioInputOn) {
        callObject.setLocalAudio(false);
      }

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

  return (
    <CallObjectContext.Provider
      value={{ callObject, join, meetingState, leave, localScreenShareTrulyOn }}
    >
      {children}
    </CallObjectContext.Provider>
  );
};
