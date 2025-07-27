import { RiZoomInLine, RiZoomOutLine } from '@remixicon/react';
import { cn } from '@/lib/utils/twmerge';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

type ZoomControlProps = {
  zoomLevel: number;
  onZoomReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
};

export function ZoomControl({
  zoomLevel,
  onZoomReset,
  onZoomIn,
  onZoomOut,
  className,
}: ZoomControlProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg',
        className
      )}>
      <button
        onClick={onZoomIn}
        disabled={zoomLevel >= MAX_ZOOM}
        className="disabled:opacity-50"
        title="Zoom in"
        data-testid="zoom-in-button">
        <RiZoomInLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
      </button>
      <button
        data-testid="reset-zoom-button"
        onClick={onZoomReset}
        className="rounded p-1 text-xs text-gray-900 hover:bg-gray-200"
        title="Reset zoom">
        {Math.round(zoomLevel * 100)}%
      </button>
      <button
        onClick={onZoomOut}
        disabled={zoomLevel <= MIN_ZOOM}
        className="disabled:opacity-50"
        title="Zoom out"
        data-testid="zoom-out-button">
        <RiZoomOutLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
      </button>
    </div>
  );
}
