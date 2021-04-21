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
  text-select: none;
`;

export const Heading = styled.h1`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  color: #ddd;
  font-size: 14px;
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
  padding: 8px 20px 20px;
`;

export const Space = styled.div`
  cursor: default;
  text-select: none;
  width: 180px;
  height: 180px;
  background: ${LIGHT_BACKGROUND.lighten(0.2).toString()};
  border-radius: 8px;
  padding: 20px;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 1px 0 0 0 rgba(255, 255, 255, 0.04),
    inset -1px 0 0 0 rgba(255, 255, 255, 0.04);
  &:hover {
    background: ${LIGHT_BACKGROUND.lighten(0.4).toString()};
  }
  margin-right: 12px;
  margin-bottom: 12px;
`;

export const SpaceName = styled.h2`
  color: white;
  font-weight: 500;
  font-size: 16px;
  margin-top: 0;
`;

export const CreateSpace = styled.div`
  text-select: none;
  width: 180px;
  height: 180px;
  margin-right: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  padding: 18px;
  border: 2px dotted #555;
  cursor: default;
`;

export const CreateSpaceTitle = styled.h2`
  color: #888;
  font-weight: 500;
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 8px;
`;

export const CreateSpaceSubTitle = styled.h3`
  color: #555;
  font-weight: 500;
  font-size: 12px;
  margin-top: 0;
`;
