import * as S from './paragraphs.styles';

import React from 'react';
import { RenderElementProps } from 'slate-react';

export interface Paragraph extends Element {
  type: 'paragraph';
}

export const isParagraph = (node: Node): node is Paragraph =>
  node.type === 'paragraph';

export const ParagraphElement: React.FC<
  RenderElementProps & {
    element: Paragraph;
  }
> = ({ attributes, element, children }) => {
  return <S.Paragraph {...attributes}>{children}</S.Paragraph>;
};
