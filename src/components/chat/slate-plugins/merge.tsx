import React from 'react';
import { createEditor } from 'slate';
import { ReactEditor, RenderElementProps, withReact } from 'slate-react';
import { LinkElement, withLinks } from './links';
import { ParagraphElement } from './paragraphs';

export const createEditorWithPlugins = () => {
  return withLinks(withReact(createEditor()));
};

export const renderElement = (props: RenderElementProps) => {
  const { element } = props;

  if (element.type === 'link') {
    return <LinkElement {...props} element={element}></LinkElement>;
  }

  return <ParagraphElement {...props} element={element}></ParagraphElement>;
};
