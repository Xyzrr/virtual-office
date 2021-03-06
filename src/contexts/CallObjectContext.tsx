import React from 'react';
import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipant,
  DailyCallOptions,
  DailyMeetingState,
} from '@daily-co/daily-js';
import { LocalMediaContext2 } from './LocalMediaContext';

interface CallObjectContextValue {
  callObject: DailyCall;
  meetingState: DailyMeetingState;
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

  const join = React.useCallback(
    async (roomName: string, identity: string) => {
      const options: DailyCallOptions = {
        url: `http://harbor.daily.co/${roomName}`,
      };

      // missing userName property in type definition
      (options as any).userName = identity;

      const participantObject = await callObject.join(options);

      console.log('Joined Daily room', participantObject);

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

  const {
    localVideoInputOn,
    localVideoInputDeviceId,
    localAudioInputOn,
    localAudioInputDeviceId,
    localScreenShareOn,
    localScreenShareSourceId,
  } = React.useContext(LocalMediaContext2);

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
      value={{ callObject, join, meetingState, leave }}
    >
      {children}
    </CallObjectContext.Provider>
  );
};
