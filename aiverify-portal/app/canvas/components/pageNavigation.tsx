import {
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiFileAddLine,
} from '@remixicon/react';
import React from 'react';
import { Layout } from 'react-grid-layout';
import { Tooltip } from '@/lib/components/tooltip';
import { cn } from '@/lib/utils/twmerge';

type PageNavigationProps = {
  totalPages: number;
  currentPage: number;
  className?: string;
  disableAddPage?: boolean;
  onPageChange: (pageIndex: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onAddPage: () => void;
};

function PageNavigation({
  totalPages,
  currentPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onAddPage,
  className,
  disableAddPage = false,
}: PageNavigationProps) {
  const getVisiblePages = () => {
    const pages = [];
    if (totalPages <= 9) {
      // Show all pages if total is 9 or less
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // For more than 9 pages, we'll show 9 items including one set of dots
    if (currentPage < 6) {
      // When current page is in first half, show 1,2,3,4,5,6,7,...,lastPage
      for (let i = 0; i < 7; i++) {
        pages.push(i);
      }
      pages.push(-1); // dots
      pages.push(totalPages - 1);
    } else if (currentPage > totalPages - 7) {
      // When current page is in last half, show 1,...,lastPage-6,lastPage-5,lastPage-4,lastPage-3,lastPage-2,lastPage-1,lastPage
      pages.push(0);
      pages.push(-1); // dots
      for (let i = totalPages - 7; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // When current page is in middle, show 1,...,currentPage-2,currentPage-1,currentPage,currentPage+1,currentPage+2,...,lastPage
      pages.push(0);
      pages.push(-1);
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
      pages.push(-1);
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 shadow-lg',
        className
      )}>
      {!disableAddPage ? (
        <React.Fragment>
          <button
            className="disabled:opacity-50"
            onClick={onAddPage}
            title="Add new page">
            <RiFileAddLine className="m-1 h-5 w-5 cursor-pointer text-gray-500 hover:text-gray-900" />
          </button>
          <div className="h-[1px] w-full bg-gray-400" />
        </React.Fragment>
      ) : null}
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 0}
        className="rounded p-1 disabled:opacity-50"
        title="Previous page">
        <RiArrowUpSLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
      </button>

      <div className="flex flex-col items-center justify-center gap-2">
        {visiblePages.map((pageIndex, idx) =>
          pageIndex === -1 ? (
            <span
              key={`dots-${idx}`}
              className="dots">
              ...
            </span>
          ) : (
            <button
              key={pageIndex}
              onClick={() => onPageChange(pageIndex)}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
                currentPage === pageIndex
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              )}
              title={`Go to page ${pageIndex + 1}`}>
              {pageIndex + 1}
            </button>
          )
        )}
      </div>

      <button
        onClick={onNextPage}
        disabled={currentPage === totalPages - 1}
        className="rounded p-1 disabled:opacity-50"
        title="Next page">
        <RiArrowDownSLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
      </button>
    </div>
  );
}

export { PageNavigation };
