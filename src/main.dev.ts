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
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { electron } from 'process';
import { Rectangle } from 'electron/main';
import { centerOnParent } from './util/electron-helpers';
import ScreenSharePicker from './components/ScreenSharePicker';
import activeWin from '@rize-io/active-win';
import * as _ from 'lodash';
import { LIGHT_BACKGROUND } from './components/constants';

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
    title: 'Virtual Office',
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
      }

      if (frameName === 'screen-share-toolbar') {
        screenShareToolbar = win;
        win.setWindowButtonVisibility(false);
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
        let wrongInitialActiveWindow = false;

        if (sourceType === 'screen') {
          const sharedDisplay = screen
            .getAllDisplays()
            .find((d) => d.id === sourceIdNumber);

          if (sharedDisplay) {
            win.setPosition(sharedDisplay.bounds.x, sharedDisplay.bounds.y);
          }

          win.setSimpleFullScreen(true);
          win.setAlwaysOnTop(true, 'screen-saver');
          win.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true,
          });
        } else {
          let bounds:
            | { x: number; y: number; width: number; height: number }
            | undefined;
          let id: number | undefined;

          try {
            const win = activeWin.sync({ screenRecordingPermission: false });
            bounds = win?.bounds;
            id = win?.id;
          } catch (e) {
            console.log('Error trying to get active window data:', e);
            failed = true;
          }

          if (id === sourceIdNumber && bounds) {
            win.setBounds(bounds);
          } else {
            wrongInitialActiveWindow = true;
          }

          win.setAlwaysOnTop(true, 'floating', -1);

          if (!failed) {
            screenShareOverlayInterval = setInterval(() => {
              const startTime = Date.now();
              activeWin({ screenRecordingPermission: false })
                .then((result) => {
                  if (screenShareOverlay == null) {
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
                    if (!screenShareOverlay.isVisible()) {
                      screenShareOverlay.show();
                    }

                    if (
                      !_.isEqual(screenShareOverlay.getBounds(), result.bounds)
                    ) {
                      screenShareOverlay.setBounds(result.bounds);
                    }
                    if (!screenShareOverlay.isAlwaysOnTop()) {
                      screenShareOverlay.setAlwaysOnTop(true, 'floating', -1);
                    }
                  } else {
                    if (!screenShareOverlay.isVisible()) {
                      return;
                    }

                    if (screenShareOverlay.isAlwaysOnTop()) {
                      screenShareOverlay.setAlwaysOnTop(false);
                      screenShareOverlay.moveAbove(
                        `window:${sourceIdNumber}:0`
                      );
                    }
                  }
                })
                .catch((e) => {
                  console.log(
                    'Failed to get active window data after successfully getting it earlier:',
                    e
                  );
                });
            }, 1000);
          }
        }
      }

      if (frameName === 'permission-helper-window') {
        permissionHelperWindow = win;
        centerOnParent(win);
      }
    }
  );

  // Open urls in the user's browser
  // mainWindow.webContents.on(
  //   'new-window',
  //   (event, url, frameName, disposition, options, additionalFeatures) => {
  //     // if (frameName === 'screen-share-picker') {
  //     //   event.preventDefault();

  //     //   screenSharePicker = new BrowserWindow({
  //     //     ...options,
  //     //     width: 840,
  //     //     height: 600,
  //     //     minWidth: undefined,
  //     //     minHeight: undefined,
  //     //     resizable: false,
  //     //     transparent: false,
  //     //     parent: mainWindow!,
  //     //     show: false,
  //     //   });

  //     //   event.newGuest = screenSharePicker;

  //     //   screenSharePicker.setBackgroundColor('#222');
  //     //   screenSharePicker.setMaximizable(false);
  //     //   screenSharePicker.setMinimizable(false);

  //     //   screenSharePicker.once('ready-to-show', () => {
  //     //     screenSharePicker?.show();
  //     //   });

  //     //   centerOnParent(screenSharePicker);

  //     //   return;
  //     // }

  //     if (frameName === 'screen-share-toolbar') {
  //       event.preventDefault();

  //       const workAreaBounds = screen.getPrimaryDisplay().workArea;

  //       screenShareToolbar = new BrowserWindow({
  //         ...options,
  //         width: 252,
  //         height: 52,
  //         x: workAreaBounds.x + workAreaBounds.width / 2 - 252 / 2,
  //         y: workAreaBounds.y + workAreaBounds.height - 52 - 8,
  //         minWidth: undefined,
  //         minHeight: undefined,
  //         resizable: false,
  //         transparent: false,
  //         show: false,
  //       });

  //       event.newGuest = screenShareToolbar;

  //       screenShareToolbar.setBackgroundColor('#00000000');
  //       screenShareToolbar.setWindowButtonVisibility?.(false);
  //       screenShareToolbar.setAlwaysOnTop(true);
  //       screenShareToolbar.setContentProtection(true);
  //       screenShareToolbar.setFocusable(false);
  //       screenShareToolbar.setVibrancy('menu');

  //       screenShareToolbar.once('ready-to-show', () => {
  //         screenShareToolbar?.show();
  //       });

  //       return;
  //     }

  //     if (frameName === 'screen-share-overlay') {
  //       event.preventDefault();

  //       const { shareSourceId } = options as any;
  //       delete (options as any).shareSourceId;

  //       const [sourceType, sourceId, sourceTab] = shareSourceId.split(':');
  //       const sourceIdNumber = parseInt(sourceId, 10);

  //       let failed = false;
  //       let wrongInitialActiveWindow = false;

  //       const additionalOpts: any = {};
  //       if (sourceType === 'screen') {
  //         const sharedDisplay = screen
  //           .getAllDisplays()
  //           .find((d) => d.id === sourceIdNumber);

  //         additionalOpts.x = sharedDisplay?.bounds.x;
  //         additionalOpts.y = sharedDisplay?.bounds.y;
  //       } else {
  //         let bounds:
  //           | { x: number; y: number; width: number; height: number }
  //           | undefined;
  //         let id: number | undefined;

  //         try {
  //           const win = activeWin.sync({ screenRecordingPermission: false });
  //           bounds = win?.bounds;
  //           id = win?.id;
  //         } catch (e) {
  //           console.log('Error trying to get active window data:', e);
  //           failed = true;
  //         }

  //         if (id === sourceIdNumber) {
  //           additionalOpts.x = bounds?.x;
  //           additionalOpts.y = bounds?.y;
  //           additionalOpts.width = bounds?.width;
  //           additionalOpts.height = bounds?.height;
  //         } else {
  //           wrongInitialActiveWindow = true;
  //         }

  //         if (!failed) {
  //           screenShareOverlayInterval = setInterval(() => {
  //             const startTime = Date.now();
  //             activeWin({ screenRecordingPermission: false })
  //               .then((result) => {
  //                 if (screenShareOverlay == null) {
  //                   return;
  //                 }

  //                 const endTime = Date.now();
  //                 console.log(
  //                   'TOOK',
  //                   endTime - startTime,
  //                   'ms',
  //                   sourceIdNumber,
  //                   result
  //                 );
  //                 if (result && result.id === sourceIdNumber) {
  //                   if (!screenShareOverlay.isVisible()) {
  //                     screenShareOverlay.show();
  //                   }

  //                   if (
  //                     !_.isEqual(screenShareOverlay.getBounds(), result.bounds)
  //                   ) {
  //                     screenShareOverlay.setBounds(result.bounds);
  //                   }
  //                   if (!screenShareOverlay.isAlwaysOnTop()) {
  //                     screenShareOverlay.setAlwaysOnTop(true, 'floating', -1);
  //                   }
  //                 } else {
  //                   if (!screenShareOverlay.isVisible()) {
  //                     return;
  //                   }

  //                   if (screenShareOverlay.isAlwaysOnTop()) {
  //                     screenShareOverlay.setAlwaysOnTop(false);
  //                     screenShareOverlay.moveAbove(
  //                       `window:${sourceIdNumber}:0`
  //                     );
  //                   }
  //                 }
  //               })
  //               .catch((e) => {
  //                 console.log(
  //                   'Failed to get active window data after successfully getting it earlier:',
  //                   e
  //                 );
  //               });
  //           }, 1000);
  //         }
  //       }

  //       screenShareOverlay = new BrowserWindow({
  //         ...options,
  //         ...additionalOpts,
  //         transparent: true,
  //         show: false,
  //         minWidth: undefined,
  //         minHeight: undefined,
  //         titleBarStyle: 'hidden',
  //         hasShadow: false,
  //       });

  //       event.newGuest = screenShareOverlay;

  //       screenShareOverlay.setBackgroundColor('#00000000');
  //       if (sourceType === 'screen') {
  //         screenShareOverlay.setSimpleFullScreen(true);
  //         screenShareOverlay.setAlwaysOnTop(true, 'screen-saver');
  //         screenShareOverlay.setVisibleOnAllWorkspaces(true, {
  //           visibleOnFullScreen: true,
  //         });
  //       } else {
  //         screenShareOverlay.setAlwaysOnTop(true, 'floating', -1);
  //       }
  //       screenShareOverlay.setFocusable(false);
  //       screenShareOverlay.setWindowButtonVisibility?.(false);
  //       screenShareOverlay.setIgnoreMouseEvents(true);
  //       screenShareOverlay.setContentProtection(true);

  //       if (!failed && !wrongInitialActiveWindow) {
  //         screenShareOverlay.once('ready-to-show', () => {
  //           screenShareOverlay?.show();
  //         });
  //       }

  //       return;
  //     }

  //     if (frameName === 'permission-helper-window') {
  //       event.preventDefault();

  //       permissionHelperWindow = new BrowserWindow({
  //         ...options,
  //         width: 640,
  //         height: 400,
  //         minWidth: undefined,
  //         minHeight: undefined,
  //         resizable: false,
  //         transparent: false,
  //         parent: mainWindow!,
  //         show: false,
  //       });

  //       event.newGuest = permissionHelperWindow;

  //       permissionHelperWindow.setBackgroundColor('#00000000');
  //       permissionHelperWindow.setMaximizable(false);
  //       permissionHelperWindow.setMinimizable(false);

  //       permissionHelperWindow.once('ready-to-show', () => {
  //         permissionHelperWindow?.show();
  //       });

  //       centerOnParent(permissionHelperWindow);

  //       return;
  //     }

  //     event.preventDefault();
  //     shell.openExternal(url);
  //   }
  // );

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

ipcMain.handle('close', (e, windowName: string) => {
  if (windowName === 'screen-share-picker') {
    // screenSharePicker?.hide();
    screenSharePicker?.close();
  }
  if (windowName === 'screen-share-toolbar') {
    screenShareToolbar?.hide();
    screenShareToolbar?.close();
  }
  if (windowName === 'screen-share-overlay') {
    if (screenShareOverlayInterval != null) {
      clearInterval(screenShareOverlayInterval);
    }

    screenShareOverlay?.hide();
    screenShareOverlay?.setSimpleFullScreen(false);
    screenShareOverlay?.close();
  }
  if (windowName === 'permission-helper-window') {
    permissionHelperWindow?.hide();
    permissionHelperWindow?.close();
  }
});

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
