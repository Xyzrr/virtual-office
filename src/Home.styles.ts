import styled from 'styled-components';
import { DARK_BACKGROUND, LIGHT_BACKGROUND } from './components/constants';

export const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: ${LIGHT_BACKGROUND.toString()};
`;

export const TopBar = styled.div`
  height: 40px;
  width: 100%;
  -webkit-app-region: drag;
  position: sticky;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const UserInfo = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

export const UserName = styled.div`
  font-size: 14px;
  color: #888;
`;

export const UserPhoto = styled.img`
  border-radius: 50%;
  width: 24px;
  margin-left: 12px;
`;
