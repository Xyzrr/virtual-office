import React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheetManager } from 'styled-components';
import electron from 'electron';
import { ipcRenderer } from 'electron/renderer';

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
  features?: string;
  onClose?(): void;
}

const NewWindow: React.FC<NewWindowProps> = ({
  name,
  open,
  features,
  children,
  onClose,
}) => {
  const [containerEl, setContainerEl] = React.useState(() =>
    document.createElement('div')
  );
  const newWindow = React.useRef<Window | null>(null);

  React.useEffect(() => {
    if (open) {
      newWindow.current = window.open('', name, features);

      if (newWindow.current != null) {
        // Need a new container because React bindings get lost somehow
        // when reusing the same container.
        const temp = document.createElement('div');
        setContainerEl(temp);

        newWindow.current.document.body.appendChild(temp);

        copyStyles(window.document, newWindow.current.document);

        newWindow.current.addEventListener('beforeunload', () => {
          onClose?.();
        });
      }
    } else {
      if (newWindow.current != null) {
        electron.ipcRenderer.invoke('close', name);
        newWindow.current = null;
      }
    }
  }, [open]);

  // TODO(john): figure out how to save memory without white-screening?
  // if (!open) {
  //   return null;
  // }

  return (
    <StyleSheetManager target={newWindow.current?.document.body}>
      <>{ReactDOM.createPortal(children, containerEl)}</>
    </StyleSheetManager>
  );
};

export default NewWindow;
