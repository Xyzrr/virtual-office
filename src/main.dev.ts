/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, screen, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { electron } from 'process';
import { Rectangle } from 'electron/main';
import { centerOnParent } from './util/electron-helpers';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '../resources');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  let screenSharePicker: BrowserWindow | undefined;

  mainWindow = new BrowserWindow({
    title: 'Virtual Office',
    show: false,
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    icon: getAssetPath('icon.png'),
    // frame: false,
    transparent: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true });

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on(
    'new-window',
    (event, url, frameName, disposition, options, additionalFeatures) => {
      if (frameName === 'screen-share-picker') {
        event.preventDefault();

        screenSharePicker = new BrowserWindow({
          ...options,
          width: 840,
          height: 600,
          minWidth: undefined,
          minHeight: undefined,
          resizable: false,
          transparent: false,
          parent: mainWindow!,
        });

        event.newGuest = screenSharePicker;

        screenSharePicker.setMaximizable(false);
        screenSharePicker.setMinimizable(false);

        centerOnParent(screenSharePicker);
        return;
      }

      event.preventDefault();
      shell.openExternal(url);
    }
  );

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

let previousMinimizedPosition: number[] | null = null;
let previousUnminimizedBounds: Rectangle | null = null;

ipcMain.handle('unminimize', () => {
  if (mainWindow == null) {
    return;
  }

  mainWindow.setWindowButtonVisibility(true);
  mainWindow.setResizable(true);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true });
  mainWindow.setMinimumSize(800, 450);
  mainWindow.setHasShadow(true);

  previousMinimizedPosition = mainWindow.getPosition();
  if (previousUnminimizedBounds != null) {
    mainWindow.setBounds(previousUnminimizedBounds);
  } else {
    mainWindow.setBounds({ width: 1280, height: 720 });
  }
});

ipcMain.handle('minimize', (e) => {
  if (mainWindow == null) {
    return;
  }

  const minimizedWidth = 240 + 16;

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setMinimumSize(minimizedWidth, 135 + 16);
  mainWindow.setWindowButtonVisibility(false);
  mainWindow.setResizable(false);
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setHasShadow(false);

  previousUnminimizedBounds = mainWindow.getBounds();

  if (previousMinimizedPosition) {
    mainWindow.setBounds({
      x: previousMinimizedPosition[0],
      y: previousMinimizedPosition[1],
      width: minimizedWidth,
    });
  } else {
    mainWindow.setBounds({
      x: screen.getPrimaryDisplay().size.width - minimizedWidth - 8,
      y: 24,
      width: minimizedWidth,
    });
  }
});

ipcMain.handle('updateMinimizedHeight', (e, minimizedHeight: number) => {
  if (mainWindow == null) {
    return;
  }

  mainWindow.setBounds({ height: minimizedHeight });
});
