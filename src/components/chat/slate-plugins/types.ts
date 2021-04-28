import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';
import { Paragraph } from './paragraphs';
import { Link } from './links';

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

export type CustomElement = Paragraph | Link;

export type CustomText = { text: string };

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
