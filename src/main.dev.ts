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
  Tray,
  Menu,
  MenuItem,
} from 'electron';
import log from 'electron-log';
import MenuBuilder from './menu';
import { electron } from 'process';
import { Rectangle } from 'electron/main';
import { centerOnParent } from './util/electron-helpers';
import ScreenSharePicker from './components/ScreenSharePicker';
import activeWin from 'xyzrr/active-win';
import * as _ from 'lodash';
import { LIGHT_BACKGROUND } from './components/constants';
import { openSystemPreferences } from 'electron-util';
import { autoUpdater } from 'electron-updater';
import { fork } from 'child_process';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

let tray: Tray | null = null;
app.whenReady().then(() => {
  tray = new Tray(getAssetPath('IconTemplate.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Harbor', type: 'normal', enabled: false },
  ]);
  tray.setToolTip('Harbor');
  tray.setContextMenu(contextMenu);
});

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    autoUpdater.on('checking-for-update', () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Harbor', type: 'normal', enabled: false },
        { label: 'Checking for update...', type: 'normal' },
      ]);
      tray?.setContextMenu(contextMenu);
    });

    autoUpdater.on('update-available', () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Harbor', type: 'normal', enabled: false },
        { label: 'Update available.', type: 'normal' },
      ]);
      tray?.setContextMenu(contextMenu);
    });

    autoUpdater.on('update-not-available', () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Harbor', type: 'normal', enabled: false },
        { label: 'On latest version.', type: 'normal' },
      ]);
      tray?.setContextMenu(contextMenu);
    });

    autoUpdater.on('error', (err) => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Harbor', type: 'normal', enabled: false },
        { label: `Error: ${err}`, type: 'normal' },
      ]);
      tray?.setContextMenu(contextMenu);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Harbor', type: 'normal', enabled: false },
        {
          label: `Downloading update (${progressObj.percent}%)`,
          type: 'normal',
        },
      ]);
      tray?.setContextMenu(contextMenu);
    });

    autoUpdater.on('update-downloaded', () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Harbor', type: 'normal', enabled: false },
        {
          label: 'Update and restart',
          type: 'normal',
          click: () => {
            autoUpdater.quitAndInstall();
          },
        },
      ]);
      tray?.setContextMenu(contextMenu);
    });

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
      { loadExtensionOptions: { allowFileAccess: true }, forceDownload }
    )
    .catch(console.log);
};

let link: string | undefined;

// This will catch clicks on links such as <a href="harbor://abc=1">open in harbor</a>
app.on('open-url', function (event, data) {
  event.preventDefault();
  link = data;
  console.log('opened via url', event, data);
  mainWindow?.webContents.send('openUrl', data);
});

app.setAsDefaultProtocolClient('harbor');

ipcMain.handle('getUrl', () => {
  return link;
});

ipcMain.on('clearUrl', () => {
  link = undefined;
});

let onActiveWin:
  | ((
      aw:
        | activeWin.MacOSResult
        | activeWin.LinuxResult
        | activeWin.WindowsResult
        | undefined
    ) => void)
  | undefined;

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    title: 'Harbor',
    show: false,
    width: 420,
    height: 420,
    icon: getAssetPath('icon.png'),
    frame: false,
    transparent: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 24 },
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nativeWindowOpen: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow?.loadURL(`file://${__dirname}/index.html`);
  });

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

  mainWindow.webContents.setWindowOpenHandler(
    ({ frameName, features, url }) => {
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

      shell.openExternal(url);

      return { action: 'deny' };
    }
  );

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

          onActiveWin = (aw) => {
            if (aw && aw.id === sourceIdNumber) {
              if (!win.isVisible()) {
                win.show();
              }

              if (!_.isEqual(win.getBounds(), aw.bounds)) {
                win.setBounds(aw.bounds);
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
          };

          win.on('close', () => {
            onActiveWin = undefined;
          });
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
        win.setWindowButtonVisibility(false);
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

ipcMain.on('setWindowSize', (e, size: { width: number; height: number }) => {
  if (mainWindow) {
    mainWindow.setMinimumSize(size.width, size.height);
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: bounds.x + (bounds.width - size.width) / 2,
      y: bounds.y + (bounds.height - size.height) / 2,
      width: size.width,
      height: size.height,
    });
  }
});

const activeWinLoop = fork(
  path.join(__dirname, 'active-win-loop.prod.js'),
  [],
  {
    stdio: 'pipe',
  }
);
activeWinLoop.on('message', (aw: any) => {
  onActiveWin?.(aw);
  mainWindow?.webContents.send('activeWin', aw);
});
