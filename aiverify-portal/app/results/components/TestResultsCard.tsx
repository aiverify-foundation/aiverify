import { TestResult } from '@/app/types';
import { Card } from '@/lib/components/card/card';
import { Checkbox } from '@/lib/components/checkbox';

type Props = {
  result: TestResult;
  enableCheckbox?: boolean;
  checked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  onClick?: () => void;
  isSplitPaneActive?: boolean;
};

export default function TestResultsCard({
  result,
  enableCheckbox = false,
  checked = false,
  onCheckboxChange,
  onClick,
  isSplitPaneActive = false,
}: Props) {
  const fileName = result.testArguments.modelFile.substring(
    result.testArguments.modelFile.lastIndexOf('/') + 1
  );
  const testDatasetName = result.testArguments.testDataset.substring(
    result.testArguments.testDataset.lastIndexOf('/') + 1
  );

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    onCheckboxChange?.(e.target.checked);
  }
  console.log('enableCheckbox', enableCheckbox);
  return (
    <Card
      size="md"
      className="mb-4 w-full shadow-md transition-shadow duration-200 hover:shadow-lg" // Option 2
      style={{
        border: '1px solid var(--color-secondary-300)',
        borderRadius: '0.5rem',
        padding: '1rem',
        width: '100%', // Option 1: Fallback for inline styles
        height: 'auto',
      }}
      cardColor="var(--color-secondary-950)"
      enableTiltEffect={false}
      onClick={onClick}>
      <Card.Content className="h-auto">
        <div className="flex items-start justify-between gap-x-4">
          {enableCheckbox && (
            <Checkbox
              size="l"
              readOnly
              defaultChecked={checked}
              label=""
              onClick={(e) => e.stopPropagation()}
              onChange={handleCheckboxChange}
            />
          )}
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-white">
              {result.name}
            </h3>
            <div
              className={`grid grid-cols-1 gap-y-2 text-sm text-gray-400 ${isSplitPaneActive ? '' : 'sm:grid-cols-2'}`}>
              <div>
                <span className="font-semibold text-white">Model File:</span>{' '}
                <span className="break-words text-white">{fileName}</span>
              </div>
              <div>
                <span className="font-semibold text-white">Model Type:</span>{' '}
                <span className="break-words text-white">
                  {result.testArguments.modelType}
                </span>
              </div>
              <div>
                <span className="font-semibold text-white">
                  Model Test Dataset:
                </span>{' '}
                <span className="break-words text-white">
                  {testDatasetName}
                </span>
              </div>
              <div>
                <span className="font-semibold text-white">Test Date:</span>{' '}
                <span className="break-words text-white">
                  {new Date(result.created_at).toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Singapore',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
