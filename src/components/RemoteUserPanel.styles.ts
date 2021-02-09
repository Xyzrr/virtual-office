import styled from 'styled-components';
import Icon from './Icon';

export const Wrapper = styled.div`
  video {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const StatusIcons = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 4px;
  display: flex;
`;

export const StatusIcon = styled(Icon)`
  padding: 4px;
  color: red;
`;
