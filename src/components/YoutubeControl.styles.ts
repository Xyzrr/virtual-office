import styled, { css } from 'styled-components';
import Icon from './Icon';

export const PlaylistWrapper = styled.div`
  padding: 4px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(0%, -100%);
`;

export const TopBar = styled.div`
  -webkit-app-region: drag;
  width: 100%;
  height: 38px;
  background: #222;
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
`;

export const VideoInput = styled.input`
`;

export const AddButton = styled.button`
`;