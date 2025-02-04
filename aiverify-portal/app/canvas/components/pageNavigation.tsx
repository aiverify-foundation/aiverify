import { RiArrowUpSLine, RiArrowDownSLine } from '@remixicon/react';
import { Layout } from 'react-grid-layout';
import { cn } from '@/lib/utils/twmerge';

interface PageNavigationProps {
  layouts: Layout[][];
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  className?: string;
}

export function PageNavigation({
  layouts,
  currentPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  className,
}: PageNavigationProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 shadow-lg',
        className
      )}>
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 0}
        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
        title="Previous page">
        <RiArrowUpSLine className="h-5 w-5 text-gray-900" />
      </button>

      <div className="flex flex-col gap-2">
        {layouts.map((_, index) => (
          <button
            key={`page-nav-${index}`}
            onClick={() => onPageChange(index)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
              currentPage === index
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            )}
            title={`Go to page ${index + 1}`}>
            {index + 1}
          </button>
        ))}
      </div>

      <button
        onClick={onNextPage}
        disabled={currentPage === layouts.length - 1}
        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
        title="Next page">
        <RiArrowDownSLine className="h-5 w-5 text-gray-900" />
      </button>
    </div>
  );
}
