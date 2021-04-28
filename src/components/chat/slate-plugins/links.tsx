import * as S from './links.styles';

import React from 'react';
import { Node, Element, Editor, Transforms, Range, Text } from 'slate';
import { RenderElementProps, ReactEditor, useSlate } from 'slate-react';
import isUrl from 'is-url';
import { CustomText } from './types';

export interface Link {
  type: 'link';
  url: string;
  children: CustomText[];
}

export const EditorWithLinks = {
  insertLink(editor: Editor, url: string) {
    if (editor.selection) {
      EditorWithLinks.wrapLink(editor, url);
    }
  },

  isLinkActive(editor: Editor) {
    const [link] = Editor.nodes(editor, {
      match: (n) => Element.isElement(n) && n.type === 'link',
    });
    return !!link;
  },

  unwrapLink(editor: Editor) {
    Transforms.unwrapNodes(editor, {
      match: (n) => Element.isElement(n) && n.type === 'link',
    });
  },

  wrapLink(editor: Editor, url: string) {
    if (EditorWithLinks.isLinkActive(editor)) {
      EditorWithLinks.unwrapLink(editor);
    }

    const { selection } = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link: Link = {
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

const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

export const withLinks = <T extends Editor>(editor: T) => {
  const { insertText, isInline, normalizeNode } = editor;

  editor.isInline = (element) => {
    return element.type === 'link' ? true : isInline(element);
  };

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      EditorWithLinks.wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && node.type === 'link') {
      const s = Editor.string(editor, path);
      if (s !== node.url && isUrl(s)) {
        Transforms.setNodes(editor, { url: s }, { at: path });
        return;
      }
    }

    normalizeNode(entry);
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
