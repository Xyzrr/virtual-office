import * as S from './SpaceTopBar.styles';
import React from 'react';
import PopupTrigger from './PopupTrigger';
import SpaceSwitcher from './SpaceSwitcher';
import SpaceAvatar from './SpaceAvatar';
import { ColyseusContext } from '../contexts/ColyseusContext';

export interface SpaceTopBarProps {
  className?: string;
  focused?: boolean;
  hide?: boolean;
  activeTab: string;
  onSelectTab(tab: string): void;
}

const SpaceTopBar: React.FC<SpaceTopBarProps> = ({
  className,
  focused,
  hide,
  activeTab,
  onSelectTab,
}) => {
  const { room: colyseusRoom } = React.useContext(ColyseusContext);

  return (
    <S.Wrapper className={className} focused={focused} hide={hide}>
      <S.LeftButtons>
        <PopupTrigger
          anchorOrigin="top left"
          transformOrigin="top left"
          popupContent={() => <SpaceSwitcher></SpaceSwitcher>}
        >
          {({ anchorAttributes }) => {
            return (
              <span {...anchorAttributes}>
                <SpaceAvatar
                  spaceName={colyseusRoom?.state.spaceName}
                ></SpaceAvatar>
              </span>
            );
          }}
        </PopupTrigger>

        {/* <S.ExitButton name="logout"></S.ExitButton> */}
      </S.LeftButtons>
      <S.MiddleButtons>
        <S.Tab
          selected={activeTab === 'focused'}
          onClick={() => {
            onSelectTab('focused');
          }}
        >
          <S.TabIcon name="view_sidebar"></S.TabIcon>
          Focused
        </S.Tab>
        <S.Tab
          selected={activeTab === 'floating'}
          onClick={() => {
            onSelectTab('floating');
          }}
        >
          <S.TabIcon name="splitscreen"></S.TabIcon>Floating
        </S.Tab>
        {/* <S.Tab>
    <S.TabIcon name="grid_view"></S.TabIcon>
    Grid
  </S.Tab> */}
      </S.MiddleButtons>
      <S.RightButtons>
        <S.Tab>
          <S.TabIcon name="link"></S.TabIcon>Copy invite link
        </S.Tab>
        {/* <S.Tab iconOnly>
    <S.TabIcon name="settings"></S.TabIcon>
  </S.Tab> */}
      </S.RightButtons>
    </S.Wrapper>
  );
};

export default SpaceTopBar;
