import styled from 'styled-components';

export const Wrapper = styled.div`
  color: white;
  border-radius: 4px;
  background: #444;
  font-size: 13px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    filter: brightness(1.1);
  }
`;
