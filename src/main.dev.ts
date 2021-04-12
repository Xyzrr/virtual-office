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
import {
  app,
  BrowserWindow,
  shell,
  screen,
  ipcMain,
  systemPreferences,
} from 'electron';
import log from 'electron-log';
import MenuBuilder from './menu';
import { electron } from 'process';
import { Rectangle } from 'electron/main';
import { centerOnParent } from './util/electron-helpers';
import ScreenSharePicker from './components/ScreenSharePicker';
import activeWin from '@rize-io/active-win';
import * as _ from 'lodash';
import { LIGHT_BACKGROUND } from './components/constants';
import { openSystemPreferences } from 'electron-util';
import { autoUpdater } from 'electron-updater';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let screenSharePicker: BrowserWindow | undefined;
let screenShareToolbar: BrowserWindow | undefined;
let screenShareOverlay: BrowserWindow | undefined;
let permissionHelperWindow: BrowserWindow | undefined;
let popupWindow: BrowserWindow | undefined;

let screenShareOverlayInterval: NodeJS.Timeout | undefined;

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

  mainWindow = new BrowserWindow({
    title: 'Harbor',
    show: false,
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    icon: getAssetPath('icon.png'),
    frame: false,
    transparent: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nativeWindowOpen: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

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

  mainWindow.webContents.setWindowOpenHandler(({ frameName, features }) => {
    if (frameName === 'screen-share-picker') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 840,
          height: 600,
          minWidth: undefined,
          minHeight: undefined,
          resizable: false,
          transparent: false,
          parent: mainWindow!,
          backgroundColor: '#222',
          maximizable: false,
          minimizable: false,
          show: false,
        },
      };
    }

    if (frameName === 'screen-share-toolbar') {
      const workAreaBounds = screen.getPrimaryDisplay().workArea;

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 252,
          height: 52,
          x: workAreaBounds.x + workAreaBounds.width / 2 - 252 / 2,
          y: workAreaBounds.y + workAreaBounds.height - 52 - 8,
          minWidth: undefined,
          minHeight: undefined,
          resizable: false,
          transparent: false,
          vibrancy: 'menu',
          focusable: false,
          alwaysOnTop: true,
          titleBarStyle: 'hidden',
          show: false,
        },
      };
    }

    if (frameName === 'screen-share-overlay') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          transparent: true,
          minWidth: undefined,
          minHeight: undefined,
          titleBarStyle: 'hidden',
          hasShadow: false,
          show: false,
        },
      };
    }

    if (frameName === 'permission-helper-window') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 640,
          height: 400,
          minWidth: undefined,
          minHeight: undefined,
          resizable: false,
          transparent: false,
          parent: mainWindow!,
          maximizable: false,
          minimizable: false,
          backgroundColor: '#00000000',
          show: false,
        },
      };
    }

    if (frameName === 'popup') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 640,
          height: 400,
          minWidth: undefined,
          minHeight: undefined,
          resizable: false,
          parent: mainWindow!,
          maximizable: false,
          minimizable: false,
          backgroundColor: '#00000000',
          show: false,
          titleBarStyle: 'hidden',
        },
      };
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on(
    'did-create-window',
    (win, { frameName, options }) => {
      if (frameName === 'screen-share-picker') {
        screenSharePicker = win;
        centerOnParent(win);
        win.on('ready-to-show', () => {
          win.show();
        });
      }

      if (frameName === 'screen-share-toolbar') {
        screenShareToolbar = win;
        win.setWindowButtonVisibility(false);
        win.on('ready-to-show', () => {
          win.show();
        });
      }

      if (frameName === 'screen-share-overlay') {
        screenShareOverlay = win;

        win.setIgnoreMouseEvents(true);
        win.setContentProtection(true);
        win.setWindowButtonVisibility(false);

        const shareSourceId = (options as any).shareSourceId;

        const [sourceType, sourceId, sourceTab] = shareSourceId.split(':');
        const sourceIdNumber = parseInt(sourceId, 10);

        let failed = false;

        if (sourceType === 'screen') {
          const sharedDisplay = screen
            .getAllDisplays()
            .find((d) => d.id === sourceIdNumber);

          if (sharedDisplay) {
            win.setPosition(sharedDisplay.bounds.x, sharedDisplay.bounds.y);
          }

          win.show();
          win.setSimpleFullScreen(true);
          win.setAlwaysOnTop(true, 'screen-saver');
          win.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true,
          });
          win.on('close', () => {
            win.hide();
            win.setSimpleFullScreen(false);
          });
        } else {
          win.setAlwaysOnTop(true, 'floating', -1);

          try {
            const aw = activeWin.sync({ screenRecordingPermission: false });

            if (aw && aw.id === sourceIdNumber) {
              win.show();
              win.setBounds(aw.bounds);
            }
          } catch (e) {
            console.log('Error trying to get active window data:', e);
            failed = true;
          }

          if (!failed) {
            screenShareOverlayInterval = setInterval(async () => {
              const startTime = Date.now();

              let result:
                | activeWin.MacOSResult
                | activeWin.LinuxResult
                | activeWin.WindowsResult
                | undefined;

              try {
                result = await activeWin({ screenRecordingPermission: false });
              } catch (e) {
                console.log(
                  'Failed to get active window data after successfully getting it earlier:',
                  e
                );
              }

              if (!result) {
                return;
              }

              const endTime = Date.now();
              console.log(
                'TOOK',
                endTime - startTime,
                'ms',
                sourceIdNumber,
                result
              );
              if (result && result.id === sourceIdNumber) {
                if (!win.isVisible()) {
                  win.show();
                }

                if (!_.isEqual(win.getBounds(), result.bounds)) {
                  win.setBounds(result.bounds);
                }
                if (!win.isAlwaysOnTop()) {
                  win.setAlwaysOnTop(true, 'floating', -1);
                }
              } else {
                if (!win.isVisible()) {
                  return;
                }

                if (win.isAlwaysOnTop()) {
                  win.setAlwaysOnTop(false);
                  win.moveAbove(`window:${sourceIdNumber}:0`);
                }
              }
            }, 1000);

            win.on('close', () => {
              if (screenShareOverlayInterval) {
                clearInterval(screenShareOverlayInterval);
              }
            });
          }
        }
      }

      if (frameName === 'permission-helper-window') {
        permissionHelperWindow = win;
        centerOnParent(win);
        win.on('ready-to-show', () => {
          win.show();
        });
      }

      if (frameName === 'popup') {
        popupWindow = win;
        log.info(options);
      }
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

app.commandLine.appendSwitch('disable-features', 'IOSurfaceCapturer');

let previousMinimizedPosition: number[] | null = null;
let previousUnminimizedBounds: Rectangle | null = null;

ipcMain.handle('unminimize', () => {
  if (mainWindow == null) {
    return;
  }

  mainWindow.setWindowButtonVisibility?.(true);
  mainWindow.setResizable(true);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);
  mainWindow.setMinimumSize(800, 450);
  mainWindow.setHasShadow(true);
  mainWindow.setContentProtection(false);

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

  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setMinimumSize(minimizedWidth, 135 + 16);
  mainWindow.setWindowButtonVisibility?.(false);
  mainWindow.setResizable(false);
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setHasShadow(false);
  mainWindow.setContentProtection(true);

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

ipcMain.on('dragWindow', (e, { mouseX, mouseY }) => {
  if (mainWindow == null) {
    return;
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  }

  const { width } = mainWindow.getBounds();
  if (mouseX > width) {
    mouseX = width;
  }

  const { x, y } = screen.getCursorScreenPoint();
  mainWindow.setPosition(x - mouseX, y - mouseY);
});

ipcMain.on('toggleMaximized', () => {
  if (mainWindow == null) {
    return;
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('isTrustedAccessibilityClient', (e, prompt: boolean) => {
  return systemPreferences.isTrustedAccessibilityClient(prompt);
});

ipcMain.handle(
  'getMediaAccessStatus',
  (e, mediaType: 'microphone' | 'camera' | 'screen') => {
    return systemPreferences.getMediaAccessStatus(mediaType);
  }
);

ipcMain.handle('askForMediaAccess', (e, mediaType: 'microphone' | 'camera') => {
  return systemPreferences.askForMediaAccess(mediaType);
});

ipcMain.on(
  'openSystemPreferences',
  (
    e,
    pane: 'universalaccess' | 'security' | 'speech' | 'sharing' | undefined,
    section: string
  ) => {
    openSystemPreferences(pane, section as any);
  }
);

ipcMain.on('showPopup', (e, bounds: Electron.Rectangle) => {
  if (popupWindow && mainWindow) {
    const parentBounds = mainWindow.getBounds();
    popupWindow.show();
    popupWindow.setBounds({
      ...bounds,
      x: bounds.x + parentBounds.x,
      y: bounds.y + parentBounds.y,
    });
  }
});
