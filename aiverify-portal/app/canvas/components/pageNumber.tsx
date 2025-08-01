import { RiDeleteBinLine } from '@remixicon/react';
import { Tooltip } from '@/lib/components/tooltip';
import { cn } from '@/lib/utils/twmerge';

type PageNumberProps = {
  pageNumber: number;
  onDeleteClick?: () => void;
  isOverflowPage?: boolean;
  zoomLevel: number;
  className?: string;
  disableDelete?: boolean;
};

function PageNumber({
  pageNumber,
  onDeleteClick,
  isOverflowPage,
  zoomLevel,
  className,
  disableDelete = false,
}: PageNumberProps) {
  return (
    <div
      className={cn(
        'absolute top-0 m-2 flex origin-top-right select-none flex-col text-xs text-gray-500',
        className
      )}
      style={{
        transform: `scale(${1 / zoomLevel})`,
        right: `${(isOverflowPage ? -15 : -10) / zoomLevel}%`,
      }}>
      Page {pageNumber}
      {onDeleteClick && !disableDelete && (
        <Tooltip
          sideOffset={-10}
          content="Delete Page"
          side="right">
          <RiDeleteBinLine
            data-testid="delete-button"
            className="mt-2 cursor-pointer rounded bg-gray-300 p-1 text-gray-500 shadow-sm hover:text-red-500"
            onClick={onDeleteClick}
          />
        </Tooltip>
      )}
      {isOverflowPage && (
        <span className="mt-2 text-xs text-gray-400">(Overflow)</span>
      )}
    </div>
  );
}

export { PageNumber };
