import React from 'react';
import { cn } from '@/lib/utils/twmerge';

type GridLinesProps = {
  columns: number;
  rows: number;
  padding: number;
  lineColor?: React.CSSProperties['borderColor'];
  className?: string;
};

function GridLines({
  columns,
  rows,
  padding = 12,
  lineColor = '#e5e7eb',
  className,
}: GridLinesProps) {
  // Don't render if columns or rows are 0 or negative
  if (columns <= 0 || rows <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute left-0 top-0 grid h-full w-full grid-cols-12 grid-rows-[repeat(36,1fr)]',
        className
      )}
      style={{
        padding,
        borderColor: lineColor,
      }}>
      {Array.from({ length: columns * rows }).map((_, index) => {
        const isRightEdge = (index + 1) % columns === 0;
        const isBottomEdge = index >= columns * (rows - 1);
        const isTopEdge = index < columns;
        const isLeftEdge = index % columns === 0;
        return (
          <div
            key={index}
            className={cn(
              'border-b border-r',
              isRightEdge && 'border-r',
              isBottomEdge && 'border-b',
              isTopEdge && 'border-t',
              isLeftEdge && 'border-l'
            )}
            style={{
              borderColor: lineColor,
            }}
          />
        );
      })}
    </div>
  );
}

export { GridLines };
