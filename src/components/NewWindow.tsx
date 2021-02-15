import React from 'react';
import ReactDOM from 'react-dom';

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet: any) => {
    if (styleSheet.cssRules) {
      // for <style> elements
      const newStyleEl = sourceDoc.createElement('style');

      Array.from(styleSheet.cssRules).forEach((cssRule: any) => {
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
}

const NewWindow: React.FC<NewWindowProps> = ({
  className,
  name,
  open,
  children,
}) => {
  const containerEl = React.useMemo(() => document.createElement('div'), [
    open,
  ]);

  React.useEffect(() => {
    if (open) {
      const newWindow = window.open('', name);

      if (newWindow != null) {
        newWindow.document.body.appendChild(containerEl);
        copyStyles(window.document, newWindow.document);
      }
    }
  }, [open]);

  return (
    <div className={className}>
      {ReactDOM.createPortal(children, containerEl)}
    </div>
  );
};

export default NewWindow;
