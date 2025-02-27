import { RiArrowDownSLine, RiArrowRightSLine } from '@remixicon/react';
import { useState } from 'react';
import { ParsedTestResults } from '@/app/canvas/types';

type SelectedTestResultProps = {
  results: ParsedTestResults[];
};

function SelectedTestResults({ results }: SelectedTestResultProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex max-w-[200px] flex-col items-start justify-start gap-2 pl-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-gray-700 hover:text-gray-500">
        {isExpanded ? (
          <RiArrowDownSLine className="h-4 w-4" />
        ) : (
          <div className="flex items-center gap-1">
            <RiArrowRightSLine className="h-4 w-4" />
            <span className="text-[0.7rem] text-gray-500">
              Click to expand selected results
            </span>
          </div>
        )}
      </button>
      {isExpanded
        ? results.map((result) => (
            <div
              className="flex max-w-[200px] flex-col pl-2"
              key={`${result.gid}-${result.cid}-${result.created_at}`}>
              <span className="break-words text-[0.75rem] font-medium text-gray-900">
                {result.name}
              </span>
              <span className="text-[0.7rem] text-gray-500">
                {new Date(result.created_at).toLocaleString()}
              </span>
            </div>
          ))
        : null}
    </div>
  );
}

export { SelectedTestResults };
