import Link from 'next/link';
import React from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { getTestRuns } from '@/lib/fetchApis/getTestRunApis';
import ActiveTestsList from './components/ActiveTestsList';

export default async function RunningTestsPage() {
  const runs = await getTestRuns();
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center">
          <Link
            href="/results/run"
            className="flex items-center text-blue-600 hover:text-blue-800">
            <Icon
              name={IconName.ArrowLeft}
              size={16}
              color="#2563eb"
            />
            <span className="ml-1">Back to Run Test</span>
          </Link>
        </div>

        <div className="flex items-center">
          <Icon
            name={IconName.Lightning}
            size={40}
            color="#FFFFFF"
          />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">Active Tests</h1>
            <h3 className="text-white">
              View and monitor currently running tests
            </h3>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="rounded-lg bg-secondary-950 p-6">
        <ActiveTestsList runs={runs} />
      </div>
    </div>
  );
}
