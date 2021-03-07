import * as S from './WelcomePanel.styles';
import React from 'react';

export interface WelcomePanelProps {
  className?: string;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({ className }) => {
  return <S.Wrapper className={className}></S.Wrapper>;
};

export default WelcomePanel;
