import { InputBlockData } from '@/app/types';

type SelectedInputBlockDatasProps = {
  results: InputBlockData[];
};

function SelectedInputBlockDatas({ results }: SelectedInputBlockDatasProps) {
  if (results.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {results.map((result, index) => (
        <div
          key={index}
          className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
          <span className="max-w-[150px] truncate">{result.name}</span>
          {results.length > 1 && (
            <span className="ml-1 text-blue-500">
              ({index + 1}/{results.length})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export { SelectedInputBlockDatas };
