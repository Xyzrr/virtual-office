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

export const Heading = styled.h1`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  color: white;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
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

export const Spaces = styled.div`
  display: flex;
  padding: 16px;
`;

export const Space = styled.div`
  width: 180px;
  height: 180px;
  background: ${LIGHT_BACKGROUND.lighten(0.2).toString()};
  border-radius: 8px;
  padding: 16px;
`;

export const SpaceName = styled.h2`
  color: white;
  font-weight: 500;
  font-size: 18px;
`;
