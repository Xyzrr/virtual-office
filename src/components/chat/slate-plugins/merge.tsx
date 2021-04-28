import React from 'react';
import { createEditor } from 'slate';
import { ReactEditor, RenderElementProps, withReact } from 'slate-react';
import { isLink, LinkElement, withLinks } from './links';
import { ParagraphElement } from './paragraphs';

export const createEditorWithPlugins = () => {
  return withLinks(withReact(createEditor()) as ReactEditor);
};

export const renderElement = (props: RenderElementProps) => {
  const { element } = props;

  if (isLink(element)) {
    return <LinkElement {...props} element={element}></LinkElement>;
  }

  return (
    <ParagraphElement
      {...props}
      element={element as Paragraph}
    ></ParagraphElement>
  );
};
