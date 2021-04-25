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
  features?: string;
  onClose?(): void;
}

const NewWindow: React.FC<NewWindowProps> = ({
  name,
  features,
  children,
  onClose,
}) => {
  React.useEffect(() => {
    console.log('MOUNTED NEWWIN');
    return () => {
      console.log('UNMOUNTED NEWWIN');
    };
  }, []);
  const containerEl = React.useMemo(() => document.createElement('div'), []);
  const newWindow = React.useRef<Window | null>(null);

  React.useEffect(() => {
    newWindow.current = window.open('', name, features);

    if (newWindow.current != null) {
      newWindow.current.document.body.appendChild(containerEl);

      copyStyles(window.document, newWindow.current.document);

      newWindow.current.addEventListener('beforeunload', () => {
        onClose?.();
      });
    }

    return () => {
      if (newWindow.current != null) {
        newWindow.current.close();
        newWindow.current = null;
      }
    };
  }, []);

  console.log('CONTAINER MOUNT', containerEl);

  return (
    <StyleSheetManager target={newWindow.current?.document.body}>
      <>{ReactDOM.createPortal(children, containerEl)}</>
    </StyleSheetManager>
  );
};

export default NewWindow;
