import { TestResult } from '@/app/types';
import { Card } from '@/lib/components/card/card';

type Props = {
  result: TestResult;
};

export default function TestResultsCard({ result }: Props) {
  const fileName = result.testArguments.modelFile.substring(
    result.testArguments.modelFile.lastIndexOf('/') + 1
  );
  const testDatasetName = result.testArguments.testDataset.substring(
    result.testArguments.testDataset.lastIndexOf('/') + 1
  );
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
      enableTiltEffect={false}>
      <Card.Content className="h-auto">
        <h3 className="mb-2 text-lg font-semibold text-white">{result.name}</h3>
        <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-400 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-white">Model File:</span>{' '}
            {fileName}
          </div>
          <div>
            <span className="font-semibold text-white">Model Type:</span>{' '}
            {result.testArguments.modelType}
          </div>
          <div>
            <span className="font-semibold text-white">
              Model Test Dataset:
            </span>{' '}
            {testDatasetName}
          </div>
          <div>
            <span className="font-semibold text-white">Test Date:</span>{' '}
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
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
