import Color from 'color';

export const MAX_INTERACTION_DISTANCE = 192;
export const PLAYER_RADIUS = 16;

export const DARK_BACKGROUND = Color('#191919');
export const LIGHT_BACKGROUND = Color('#262626');
export const HIGHLIGHT = Color(`rgb(0, 216, 41)`);
export const DANGER = Color(`rgb(253, 50, 74)`);

export const HOST = process.env.LOCAL
  ? 'localhost:5000'
  : 'virtual-office-server.herokuapp.com';
