import { RiDeleteBinLine } from "@remixicon/react";
import { Tooltip } from "@/lib/components/tooltip";
import { cn } from "@/lib/utils/twmerge";

type PageNumberProps = {
  pageNumber: number;
  onDeleteClick?: () => void;
  isOverflowPage?: boolean;
};

function PageNumber({ pageNumber, onDeleteClick, isOverflowPage }: PageNumberProps) {
  return (
    <div className={cn(
      'absolute top-0 m-2 flex flex-col text-xs text-gray-500',
      !isOverflowPage && 'right-[-65px]',
      isOverflowPage && 'right-[-90px]'
    )}>
      Page {pageNumber}
      {!isOverflowPage && onDeleteClick && (
        <Tooltip
          sideOffset={-10}
          content="Delete Page"
          side="right">
          <RiDeleteBinLine
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
