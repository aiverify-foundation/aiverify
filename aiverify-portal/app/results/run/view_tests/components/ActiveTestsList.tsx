'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TestRunOutput, getTestRuns } from '@/lib/fetchApis/getTestRunApis';

export default function ActiveTestsList({ runs }: { runs: TestRunOutput[] }) {
  const [tests, setTests] = useState<TestRunOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(10); // seconds
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Initialize with server-provided data
  useEffect(() => {
    if (runs) {
      const activeTests = runs.filter(
        (test) => test.status === 'pending' || test.status === 'running'
      );
      setTests(activeTests);
      setLoading(false);
      setLastRefreshTime(new Date());
    }
  }, [runs]);

  // Function to fetch fresh data from API
  const fetchTests = async () => {
    try {
      setLoading(true);
      const allTests = runs;

      // Filter for only active tests (pending or running)
      const activeTests = allTests.filter(
        (test) => test.status === 'pending' || test.status === 'running'
      );

      setTests(activeTests);
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load test runs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set up auto-refresh interval
  useEffect(() => {
    // Only use client-side auto-refresh if needed (when we have pending tests)
    if (tests.length === 0) return;

    console.log(
      `Setting up auto-refresh interval (${refreshInterval} seconds)`
    );
    const intervalId = setInterval(() => {
      console.log(`Auto-refreshing test data...`);
      fetchTests();
    }, refreshInterval * 1000);

    // Clean up the interval on component unmount
    return () => {
      console.log('Clearing auto-refresh interval');
      clearInterval(intervalId);
    };
  }, [refreshInterval, tests.length]); // Re-establish interval when refresh interval or test count changes

  // Format relative time since last refresh
  const getTimeSinceLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - lastRefreshTime.getTime()) / 1000
    );

    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 120) return '1 minute ago';
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  };

  // Simplified algorithm name display
  const getAlgorithmName = (gid: string, cid: string) => {
    // Extract the displayable name from the GID or CID
    const parts = gid.split('.');
    const simpleName = parts[parts.length - 1] || cid;
    return simpleName.replace(/_/g, ' ');
  };

  // Calculate estimated time based on progress
  const getEstimatedTimeRemaining = (progress: number) => {
    if (progress <= 0 || progress >= 100) return 'Unknown';
    if (progress < 5) return 'Calculating...';

    // This is a placeholder - in a real implementation, you would track
    // the rate of progress and calculate this more accurately
    return 'A few minutes';
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Active Tests</h2>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-gray-400">
            Last updated: {getTimeSinceLastRefresh()}
          </div>
          <div className="text-white">
            Auto-refresh:
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-2 rounded bg-secondary-800 p-1 text-white">
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
            </select>
          </div>
          <Button
            variant={ButtonVariant.OUTLINE}
            text={loading ? 'Refreshing...' : 'Refresh Now'}
            size="sm"
            onClick={fetchTests}
            disabled={loading}
          />
        </div>
      </div>

      {loading && tests.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-2xl">Loading...</div>
            <div className="text-sm text-gray-400">Fetching active tests</div>
          </div>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button
            variant={ButtonVariant.PRIMARY}
            text="Retry"
            size="md"
            className="mt-4"
            onClick={fetchTests}
          />
        </div>
      ) : tests.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-3xl text-gray-400">No Active Tests</div>
          <p className="mb-6 text-gray-500">
            There are currently no tests running or pending.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/results/run">
              <Button
                variant={ButtonVariant.PRIMARY}
                text="Run a New Test"
                size="md"
              />
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-right">
            <span className="text-sm text-gray-400">
              {tests.length} active test{tests.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-secondary-800">
            {tests.map((test, index) => (
              <div
                key={test.id}
                className={`flex flex-col border-b border-secondary-800 p-4 ${
                  index % 2 === 0 ? 'bg-secondary-900' : 'bg-secondary-950'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 flex-col">
                    <div className="mb-1 flex items-center">
                      <span className="mr-2 text-lg font-medium text-white">
                        {getAlgorithmName(test.algorithmGID, test.algorithmCID)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          test.status === 'pending'
                            ? 'bg-yellow-200 text-yellow-800'
                            : test.status === 'running'
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-gray-200 text-gray-800'
                        }`}>
                        {test.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <span>ID: {test.id.slice(0, 8)}...</span> •
                      <span className="ml-2">Model: {test.modelFilename}</span>{' '}
                      •
                      <span className="ml-2">
                        Dataset: {test.testDatasetFilename}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Progress</span>
                    <div className="flex items-center text-xs">
                      <span className="font-medium text-white">
                        {test.progress}%
                      </span>
                      {test.status === 'running' &&
                        test.progress > 0 &&
                        test.progress < 100 && (
                          <span className="ml-2 text-gray-400">
                            Est. time remaining:{' '}
                            {getEstimatedTimeRemaining(test.progress)}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-800">
                    <div
                      className={`h-2 rounded-full ${
                        test.status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-primary-500'
                      } ${test.progress > 0 ? '' : 'animate-pulse'}`}
                      style={{
                        width: `${test.progress === 0 ? 5 : test.progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Error messages if any */}
                {test.errorMessages && (
                  <div className="mt-2 rounded border border-red-800 bg-red-900 bg-opacity-30 p-2">
                    <div className="text-xs font-medium text-red-400">
                      Error:
                    </div>
                    <div className="text-xs text-red-300">
                      {test.errorMessages}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
