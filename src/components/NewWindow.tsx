import React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheetManager } from 'styled-components';

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    if (styleSheet.cssRules) {
      // for <style> elements
      const newStyleEl = sourceDoc.createElement('style');

      Array.from(styleSheet.cssRules).forEach((cssRule) => {
        // write the text of each rule into the body of the style element
        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
      });

      targetDoc.head.appendChild(newStyleEl);
    } else if (styleSheet.href) {
      // for <link> elements loading CSS from a URL
      const newLinkEl = sourceDoc.createElement('link');

      newLinkEl.rel = 'stylesheet';
      newLinkEl.href = styleSheet.href;
      targetDoc.head.appendChild(newLinkEl);
    }
  });
}

export interface NewWindowProps {
  className?: string;
  name: string;
  open: boolean;
  onClose?(): void;
}

const NewWindow: React.FC<NewWindowProps> = ({
  name,
  open,
  children,
  onClose,
}) => {
  const containerEl = React.useMemo(() => document.createElement('div'), [
    open,
  ]);
  const newWindow = React.useRef<Window | null>(null);

  React.useEffect(() => {
    if (open) {
      newWindow.current = window.open('', name);

      if (newWindow.current != null) {
        newWindow.current.document.body.appendChild(containerEl);
        copyStyles(window.document, newWindow.current.document);

        newWindow.current.addEventListener('beforeunload', () => {
          onClose?.();
        });
      }
    } else {
      newWindow.current?.close();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <StyleSheetManager target={containerEl}>
      <>{ReactDOM.createPortal(children, containerEl)}</>
    </StyleSheetManager>
  );
};

export default NewWindow;
