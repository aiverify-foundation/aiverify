import { RiDeleteBin5Line, RiFileEditLine } from '@remixicon/react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';

type GridItemContextMenuProps = {
  widget: WidgetOnGridLayout;
  menuPosition: { top: number; left: number };
  onDeleteClick: () => void;
  onEditClick: () => void;
};

function GridItemContextMenu({ widget, menuPosition, onDeleteClick, onEditClick }: GridItemContextMenuProps) {
  return createPortal(
    <div
      className="fixed flex flex-col gap-1"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}>
      <div className="max-w-[200px] break-words rounded bg-secondary-600 px-2 py-1 text-xs shadow-lg">
        {widget.name}
      </div>
      <div className="flex gap-1">
        <div
          className="cursor-pointer rounded bg-secondary-400 shadow-lg"
          onMouseDown={(e) => {
            // Prevent grid drag from starting
            e.stopPropagation();
          }}
          onClick={onEditClick}>
          <RiFileEditLine className="m-1 h-5 w-5 text-white hover:text-blue-800" />
        </div>
        <div
          className="cursor-pointer rounded bg-secondary-400 shadow-lg"
          onMouseDown={(e) => {
            // Prevent grid drag from starting
            e.stopPropagation();
          }}
          onClick={onDeleteClick}>
          <RiDeleteBin5Line className="m-1 h-5 w-5 text-white hover:text-red-500" />
        </div>
      </div>
    </div>,
    document.body
  );
}

export { GridItemContextMenu };
