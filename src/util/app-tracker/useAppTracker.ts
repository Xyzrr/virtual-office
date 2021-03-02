import React from 'react';
import activeWin from 'active-win';
import iconFigma from './app-icons/figma.png';
import iconNotion from './app-icons/notion.png';
import iconVSCode from './app-icons/vscode.png';
import * as Colyseus from 'colyseus.js';

const APPS = [
  { name: 'Code', icon: iconVSCode },
  { name: 'Figma', url: 'figma.com', icon: iconFigma },
  { name: 'Notion', url: 'notion.so', icon: iconNotion },
];

export interface AppInfo {
  name: string;
  title: string;
  url?: string;
}

export const useAppTracker = (colyseusRoom: Colyseus.Room | null) => {
  const [localApp, setLocalApp] = React.useState<AppInfo | null>(null);

  React.useEffect(() => {
    if (colyseusRoom == null) {
      return;
    }

    const interval = window.setInterval(() => {
      activeWin().then((result) => {
        console.log('APP IS', result);

        if (result == null) {
          return;
        }

        for (const app of APPS) {
          if (
            result.owner.name.includes(app.name) ||
            ((result as any).url != null &&
              (result as any).url.includes(app.url))
          ) {
            const appInfo = {
              title: result.title,
              name: app.name,
              url: (result as any).url,
            };

            setLocalApp(appInfo);
            colyseusRoom.send('appInfo', { ...appInfo });
          }
        }
      });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [colyseusRoom]);

  return localApp;
};
