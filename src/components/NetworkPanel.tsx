import * as S from './NetworkPanel.styles';
import React, { useContext } from 'react';
import isHotkey from 'is-hotkey';
import CallObjectContext from '../contexts/CallObjectContext';
import { DailyNetworkStats } from '@daily-co/daily-js';

export const useNetworkPanel = () => {
  const [showNetworkPanel, setShowNetworkPanel] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isHotkey('meta+shift+d')(e)) {
        setShowNetworkPanel((s) => !s);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return showNetworkPanel;
};

export interface NetworkPanelProps {
  className?: string;
}

const NetworkPanel: React.FC<NetworkPanelProps> = ({ className }) => {
  const callObject = useContext(CallObjectContext);

  const [stats, setStats] = React.useState<DailyNetworkStats | null>(null);

  React.useEffect(() => {
    if (callObject == null) {
      return;
    }

    const onNetworkQualityChange = async () => {
      const s = await callObject.getNetworkStats();
      setStats(s);
      console.log('STATS', s);
    };

    callObject.on('network-quality-change', onNetworkQualityChange);

    return () => {
      callObject.off('network-quality-change', onNetworkQualityChange);
    };
  }, [callObject]);

  return (
    <S.Wrapper className={className}>
      {stats == null ? (
        <>Loading</>
      ) : (
        <>
          <S.Stat>
            <S.StatLabel>Threshold:</S.StatLabel>
            <S.StatValue>{stats.threshold}</S.StatValue>
          </S.Stat>
          <S.Stat>
            <S.StatLabel>Quality:</S.StatLabel>
            <S.StatValue>{stats.quality}</S.StatValue>
          </S.Stat>
          <S.Stat>
            <S.StatLabel>Receive bitrate:</S.StatLabel>
            <S.StatValue>
              {stats.stats.latest.videoRecvBitsPerSecond}
            </S.StatValue>
          </S.Stat>
          <S.Stat>
            <S.StatLabel>Send bitrate:</S.StatLabel>
            <S.StatValue>
              {stats.stats.latest.videoSendBitsPerSecond}
            </S.StatValue>
          </S.Stat>
          <S.Stat>
            <S.StatLabel>Worst recv pkt loss:</S.StatLabel>
            <S.StatValue>{stats.stats.worstVideoRecvPacketLoss}</S.StatValue>
          </S.Stat>
          <S.Stat>
            <S.StatLabel>Worst send pkt loss:</S.StatLabel>
            <S.StatValue>{stats.stats.worstVideoSendPacketLoss}</S.StatValue>
          </S.Stat>
        </>
      )}
    </S.Wrapper>
  );
};

export default NetworkPanel;
