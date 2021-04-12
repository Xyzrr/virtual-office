import React from 'react';
import { Origin } from './Popup';
import AnchoredPopup from './AnchoredPopup';

export type TriggerGenerator = (props: {
  anchorAttributes: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
  open: boolean;
}) => React.ReactNode;

export interface PopupTriggerProps {
  transformOrigin?: Origin;
  anchorOrigin?: Origin;
  children: TriggerGenerator;
  popupContent(props: { close: () => void }): React.ReactNode;
}

const PopupTrigger: React.FC<PopupTriggerProps> = ({
  transformOrigin,
  anchorOrigin,
  children,
  popupContent,
}) => {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {children({ anchorAttributes: { onMouseDown }, open: anchorEl != null })}
      {anchorEl && (
        <AnchoredPopup
          transformOrigin={transformOrigin}
          anchorOrigin={anchorOrigin}
          anchorEl={anchorEl}
        >
          {popupContent({ close })}
        </AnchoredPopup>
      )}
    </>
  );
};

export default PopupTrigger;
