import * as S from './links.styles';

import React from 'react';
import { Node, Element, Editor, Transforms, Range } from 'slate';
import { RenderElementProps, ReactEditor, useSlate } from 'slate-react';
import isUrl from 'is-url';

export interface Link extends Element {
  type: 'link';
  url: string;
}

export const EditorWithLinks = {
  insertLink(editor: Editor, url: string) {
    if (editor.selection) {
      EditorWithLinks.wrapLink(editor, url);
    }
  },

  isLinkActive(editor: Editor) {
    const [link] = Editor.nodes(editor, { match: (n) => isLink(n) });
    return !!link;
  },

  unwrapLink(editor: Editor) {
    Transforms.unwrapNodes(editor, { match: (n) => isLink(n) });
  },

  wrapLink(editor: Editor, url: string) {
    if (EditorWithLinks.isLinkActive(editor)) {
      EditorWithLinks.unwrapLink(editor);
    }

    const { selection } = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link = {
      type: 'link',
      url,
      children: isCollapsed ? [{ text: url }] : [],
    };

    if (isCollapsed) {
      Transforms.insertNodes(editor, link);
    } else {
      Transforms.wrapNodes(editor, link, { split: true });
      Transforms.collapse(editor, { edge: 'end' });
    }
  },
};

export const isLink = (node: Node): node is Link => node.type === 'link';

export const LinkElement: React.FC<RenderElementProps & { element: Link }> = ({
  attributes,
  element,
  children,
}) => {
  return (
    <S.Link {...attributes} href={element.url} target="_blank">
      {children}
    </S.Link>
  );
};

export const withLinks = <T extends Editor>(editor: T) => {
  const { insertText, isInline } = editor;

  editor.isInline = (element) => {
    return isLink(element) ? true : isInline(element);
  };

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      EditorWithLinks.wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  // editor.insertData = data => {
  //   const text = data.getData('text/plain');

  //   if (text && isUrl(text)) {
  //     EditorWithLinks.wrapLink(editor, text);
  //   } else {
  //     insertData(data);
  //   }
  // };

  return editor;
};
