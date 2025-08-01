'use client';
import {
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiFileAddLine,
  RiInputCursorMove,
} from '@remixicon/react';
import React, { useState, useRef } from 'react';
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
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
      for (let i = 0; i < 5; i++) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPageInputValue(value);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInputValue, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber - 1); // Convert to 0-indexed
      setPageInputValue('');
      setIsInputVisible(false);
    }
  };

  const toggleInput = () => {
    setIsInputVisible(!isInputVisible);
    // Focus the input when it becomes visible
    if (!isInputVisible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Wait for the transition to complete
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Input field container - positioned absolutely to the left */}
      <div
        className={cn(
          'absolute right-full mr-2 transition-all duration-300 ease-in-out',
          isInputVisible
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-8 opacity-0'
        )}
        style={{
          width: '120px',
          visibility: totalPages > 9 ? 'visible' : 'hidden',
        }}>
        <div className="rounded-lg bg-gray-300 p-2 shadow-lg">
          <form
            onSubmit={handleInputSubmit}
            className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={pageInputValue}
              onChange={handleInputChange}
              placeholder={`1-${totalPages}`}
              className="w-full rounded bg-gray-100 px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Go to page"
            />
          </form>
        </div>
      </div>

      {/* Main navigation container */}
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
              title="Add new page"
              data-testid="add-page-button">
              <RiFileAddLine className="m-1 h-5 w-5 cursor-pointer text-gray-500 hover:text-gray-900" />
            </button>
            <div className="h-[1px] w-full bg-gray-400" />
          </React.Fragment>
        ) : null}

        {totalPages > 9 && (
          <button
            onClick={toggleInput}
            title="Go to specific page"
            className={cn(
              'rounded p-1 transition-colors',
              isInputVisible && 'bg-gray-400 text-white'
            )}
            data-testid="input-toggle-button">
            <RiInputCursorMove className="h-5 w-5 text-gray-500 hover:text-gray-900" />
          </button>
        )}

        <button
          onClick={onPreviousPage}
          disabled={currentPage === 0}
          className="rounded p-1 disabled:opacity-50"
          title="Previous page"
          data-testid="previous-button">
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
                data-testid={`page-${pageIndex + 1}-button`}
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
          title="Next page"
          data-testid="next-button">
          <RiArrowDownSLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
        </button>
      </div>
    </div>
  );
}

export { PageNavigation };
