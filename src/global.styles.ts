import { createGlobalStyle } from 'styled-components';

const styles = createGlobalStyle`
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }
  * {
    box-sizing: border-box;
    &:focus {
      outline: none;
    }
  }
  .MuiButtonBase-root {
    cursor: default !important;
  }
`;

export default styles;
