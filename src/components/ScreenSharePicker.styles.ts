import styled from 'styled-components';

export const Wrapper = styled.div`
  flex-wrap: wrap;
  background: #222;
  width: 100vw;
  height: 100vh;
  overflow: auto;
  -webkit-app-region: drag;
`;

export const TopBar = styled.div`
  width: 100%;
  height: 36px;
  background: #222;
  position: sticky;
  top: 0;
`;

export const BottomBar = styled.div`
  width: 100%;
  background: #222;
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  padding: 12px;
`;

export const ShareButton = styled.button`
  outline: none;
  border: none;
  border-radius: 4px;
  background: #1b95e0;
  color: white;
  padding: 4px 8px;
`;

export const ScreensSectionWrapper = styled.div`
  padding: 18px;
`;

export const WindowsSectionWrapper = styled.div`
  padding: 18px;
`;

export const Divider = styled.hr`
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0 18px;
`;

export const ScreenShareOptionsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

export const Title = styled.h2`
  color: white;
  margin-top: 12px;
  font-size: 20px;
`;

export const ScreenShareOption = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 18px;
  margin-bottom: 18px;
  overflow: hidden;
`;

export const ScreenOptionThumbnailWrapper = styled.div`
  height: 162px;
  width: 288px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
`;

export const ScreenOptionThumbnail = styled.img`
  max-width: 100%;
  max-height: 100%;
`;

export const WindowOptionThumbnailWrapper = styled.div`
  height: 120px;
  width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
`;

export const WindowOptionThumbnail = styled.img`
  max-width: 100%;
  max-height: 100%;
`;

export const WindowOptionLabel = styled.div`
  display: flex;
  max-width: 180px;
  align-items: center;
  margin-bottom: 4px;
`;

export const WindowOptionName = styled.div`
  color: white;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 13px;
`;

export const WindowOptionAppIcon = styled.img`
  margin-right: 6px;
  width: 20px;
  height: 20px;
  display: inline-block;
  vertical-align: middle;
`;
