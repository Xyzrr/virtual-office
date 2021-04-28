import * as S from './paragraphs.styles';

import React from 'react';
import { RenderElementProps } from 'slate-react';
import { CustomText } from './types';

export interface Paragraph {
  type: 'paragraph';
  children: CustomText[];
}

export const ParagraphElement: React.FC<
  RenderElementProps & {
    element: Paragraph;
  }
> = ({ attributes, element, children }) => {
  return <S.Paragraph {...attributes}>{children}</S.Paragraph>;
};
