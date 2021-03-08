import * as S from './NetworkPanel.styles';
import React from 'react';
import isHotkey from 'is-hotkey';
import { VideoCallDebugContext } from '../contexts/VideoCallContext/VideoCallContext';

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
  const debugStats = React.useContext(VideoCallDebugContext);

  return (
    <S.Wrapper className={className}>
      {debugStats ? (
        <>
          {Object.entries(debugStats).map(([key, value]) => {
            return (
              <S.Stat>
                <S.StatLabel>{key}:</S.StatLabel>
                <S.StatValue>{value}</S.StatValue>
              </S.Stat>
            );
          })}
        </>
      ) : (
        <>Loading</>
      )}
    </S.Wrapper>
  );
};

export default NetworkPanel;
