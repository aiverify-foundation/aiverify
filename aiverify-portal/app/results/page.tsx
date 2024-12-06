// portal/app/results/page.tsx
import { TestResults } from '../types';
import TestResultsList from './components/TestResultsList';
import { Icon, IconName } from '@/lib/components/IconSVG';
import ActionButtons from './components/ActionButton';
import { getTestResults } from '@/lib/fetchApis/getAllTestResults';

export default async function ResultsPage() {
  const testResults = await getTestResults();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon name={IconName.Lightning} size={40} color="#FFFFFF" />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">Test Results</h1>
            <h3 className="text-white">View and manage test results</h3>
          </div>
        </div>

        <ActionButtons />
      </div>
      <TestResultsList testResults={testResults} />
    </div>
  );
}
