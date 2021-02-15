import { BrowserWindow } from 'electron';

export const centerOnParent = (child: BrowserWindow) => {
  const bounds = child.getBounds();
  const parentBounds = child.getParentWindow().getBounds();

  child.setPosition(
    parentBounds.x + parentBounds.width / 2 - bounds.width / 2,
    parentBounds.y + parentBounds.height / 2 - bounds.height / 2
  );
};
