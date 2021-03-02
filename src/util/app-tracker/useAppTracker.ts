import React from 'react';
import activeWin from 'active-win';
import * as Colyseus from 'colyseus.js';

import iconFigma from './app-icons/figma.ico';
import iconNotion from './app-icons/notion.ico';
import iconVSCode from './app-icons/vscode.ico';
import iconAsana from './app-icons/asana.png';
import iconGoogleCal from './app-icons/google-cal.ico';
import iconGoogleDocs from './app-icons/google-docs.ico';
import iconGoogleDrive from './app-icons/google-drive.png';
import iconGoogleMeet from './app-icons/google-meet.png';
import iconGoogleSheets from './app-icons/google-sheets.ico';
import iconGoogleSlides from './app-icons/google-slides.ico';
import iconGithub from './app-icons/github.png';
import iconGoLand from './app-icons/goland.png';
import iconAirtable from './app-icons/airtable.png';
import iconAtom from './app-icons/atom.png';
import iconPhotoshop from './app-icons/photoshop.png';
import iconIllustator from './app-icons/illustrator.png';
import iconAws from './app-icons/aws.png';
import iconBlender from './app-icons/blender.png';
import iconCLion from './app-icons/clion.png';
import iconCoda from './app-icons/coda.png';
import iconDatadog from './app-icons/datadog.png';
import iconDigitalOcean from './app-icons/digitalocean.png';
import iconGCloud from './app-icons/gcloud.png';
import iconGitLab from './app-icons/gitlab.png';
import iconIntelliJ from './app-icons/intellij.png';
import iconIntercom from './app-icons/intercom.png';
import iconJira from './app-icons/jira.png';
import iconSlack from './app-icons/slack.png';

export const APPS = [
  { name: 'VS Code', nameMatch: 'Code', icon: iconVSCode },
  { name: 'Figma', url: 'figma.com', icon: iconFigma },
  { name: 'Notion', url: 'notion.so', icon: iconNotion },
  { name: 'Asana', url: 'asana.com', icon: iconAsana },
  { name: 'Google Calendar', url: 'calendar.google.com', icon: iconGoogleCal },
  { name: 'Google Docs', url: 'docs.google.com', icon: iconGoogleDocs },
  { name: 'Google Drive', url: 'drive.google.com', icon: iconGoogleDrive },
  { name: 'Google Meet', url: 'meet.google.com', icon: iconGoogleMeet },
  {
    name: 'Google Sheets',
    url: 'docs.google.com/spreadsheets',
    icon: iconGoogleSheets,
  },
  {
    name: 'Google Slides',
    url: 'docs.google.com/presentations',
    icon: iconGoogleSlides,
  },
  {
    name: 'Github',
    url: 'github.com',
    icon: iconGithub,
  },
  {
    name: 'GoLand',
    icon: iconGoLand,
  },
  {
    name: 'Airtable',
    url: 'airtable.com',
    icon: iconAirtable,
  },
  {
    name: 'Atom',
    icon: iconAtom,
  },
  {
    name: 'Photoshop',
    icon: iconPhotoshop,
  },
  {
    name: 'Illustrator',
    icon: iconIllustator,
  },
  {
    name: 'AWS',
    url: 'aws.amazon.com',
    icon: iconAws,
  },
  {
    name: 'Blender',
    icon: iconBlender,
  },
  { name: 'CLion', icon: iconCLion },

  { name: 'Coda', icon: iconCoda },

  { name: 'Datadog', url: 'datadoghq.com', icon: iconDatadog },
  { name: 'DigitalOcean', url: 'digitalocean.com', icon: iconDigitalOcean },
  { name: 'Google Cloud', url: 'cloud.google.com', icon: iconGCloud },
  { name: 'GitLab', url: 'gitlab.com', icon: iconGitLab },
  { name: 'IntelliJ', icon: iconIntelliJ },
  { name: 'Intercom', url: 'intercom.com', icon: iconIntercom },
  { name: 'Jira', url: 'atlassian.net', icon: iconJira },
  { name: 'Slack', url: 'slack.com', icon: iconSlack },
];

export interface AppInfo {
  name: string;
  title: string;
  url?: string;
}

export const useAppTracker = (colyseusRoom: Colyseus.Room | null) => {
  const [localApp, setLocalApp] = React.useState<AppInfo | undefined>(
    undefined
  );

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
            (app.nameMatch && result.owner.name.includes(app.nameMatch)) ||
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
