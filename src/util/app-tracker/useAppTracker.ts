import React from 'react';
import activeWin from 'active-win';
import iconFigma from './app-icons/figma.png';
import iconNotion from './app-icons/notion.png';
import iconVSCode from './app-icons/vscode.png';
import * as Colyseus from 'colyseus.js';

const APPS = [
  { name: 'Code', icon: iconVSCode },
  { name: 'Figma', url: 'figma.com', icon: iconFigma },
  { name: 'Notion', url: 'notion.so', icon: iconFigma },
];

export const useAppTracker = (colyseusRoom: Colyseus.Room | null) => {
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
            colyseusRoom.send('appInfo', {
              title: result.title,
              name: app.name,
              url: (result as any).url,
            });
          }
        }
      });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [colyseusRoom]);
};
