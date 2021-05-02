import React from 'react';
import { render } from 'react-dom';
import Routes from './Routes';
import 'normalize.css';

render(
  <React.StrictMode>
    <Routes />
  </React.StrictMode>,
  document.getElementById('root')
);
