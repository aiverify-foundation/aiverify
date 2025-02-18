import { RiDeleteBinLine } from "@remixicon/react";
import { Tooltip } from "@/lib/components/tooltip";

type PageNumberProps = {
  pageNumber: number;
  onDeleteClick: () => void;
};

function PageNumber({ pageNumber, onDeleteClick }: PageNumberProps) {
  return <div className="absolute right-[-65px] top-0 m-2 flex flex-col text-xs text-gray-500">
    Page {pageNumber}
    <Tooltip
      sideOffset={-10}
      content="Delete Page"
      side="right">
      <RiDeleteBinLine
        className="mt-2 cursor-pointer rounded bg-gray-300 p-1 text-gray-500 shadow-sm hover:text-red-500"
        onClick={onDeleteClick}
      />
    </Tooltip>
  </div>;
}

export { PageNumber };
