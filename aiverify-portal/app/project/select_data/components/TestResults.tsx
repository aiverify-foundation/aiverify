'use client';

import { useEffect, useState } from 'react';
import { Algorithm } from '@/app/types';
import { TestResult } from '@/app/types';
import { getTestResults } from '@/lib/fetchApis/getTestResults';

interface TestResultsProps {
  projectId?: string | null;
  requiredAlgorithms: Algorithm[];
  onTestResultsChange: (
    testResults: Array<{ gid: string; cid: string; id: number }>
  ) => void;
}

export default function TestResults({
  projectId,
  requiredAlgorithms,
  onTestResultsChange,
}: TestResultsProps) {
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);
  const [selectedTestResults, setSelectedTestResults] = useState<{
    [key: string]: TestResult | null;
  }>({});

  // Fetch all test results on mount
  useEffect(() => {
    async function fetchTestResults() {
      try {
        const results = await getTestResults();
        setAllTestResults(results);
      } catch (error) {
        console.error('Failed to fetch test results:', error);
      }
    }
    fetchTestResults();
  }, []);

  // Update parent component when selections change
  useEffect(() => {
    const selectedResults = Object.values(selectedTestResults)
      .filter((result): result is TestResult => result !== null)
      .map((result) => ({
        gid: result.gid,
        cid: result.cid,
        id: result.id,
      }));
    onTestResultsChange(selectedResults);
  }, [selectedTestResults, onTestResultsChange]);

  // Get test results for a specific algorithm
  const getTestResultsForAlgorithm = (algorithm: Algorithm) => {
    return allTestResults.filter(
      (result) => result.gid === algorithm.gid && result.cid === algorithm.cid
    );
  };

  const handleTestResultChange = (
    algorithm: Algorithm,
    testResultId: string
  ) => {
    const key = `${algorithm.gid}-${algorithm.cid}`;
    if (!testResultId) {
      setSelectedTestResults((prev) => ({
        ...prev,
        [key]: null,
      }));
      return;
    }

    const selectedResult = allTestResults.find(
      (result) => result.id === parseInt(testResultId)
    );

    setSelectedTestResults((prev) => ({
      ...prev,
      [key]: selectedResult || null,
    }));
  };

  return (
    <div className="rounded-lg bg-[#2D3142] p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Test Results
          </h2>
          <p className="text-sm text-gray-400">
            Upload test results or select existing test results.
          </p>
        </div>
        <button
          className="rounded bg-[#4B5563] px-4 py-2 text-sm text-gray-300 hover:bg-[#374151]"
          onClick={() => {}}>
          UPLOAD TEST RESULTS
        </button>
      </div>

      <div className="space-y-4">
        {requiredAlgorithms.map((algorithm) => {
          const key = `${algorithm.gid}-${algorithm.cid}`;
          const availableResults = getTestResultsForAlgorithm(algorithm);
          const selectedResult = selectedTestResults[key];

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4">
              <label className="w-64 text-white">{algorithm.name}</label>
              <div className="relative flex-1">
                <select
                  value={selectedResult?.id || ''}
                  onChange={(e) =>
                    handleTestResultChange(algorithm, e.target.value)
                  }
                  className="w-full cursor-pointer appearance-none rounded bg-[#1F2937] p-3 pr-10 text-gray-300">
                  <option value="">Choose Test Results</option>
                  {availableResults.map((result) => (
                    <option
                      key={result.id}
                      value={result.id}>
                      Test Result #{result.id} -{' '}
                      {new Date(result.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <svg
                    className="h-4 w-4 fill-current text-gray-400"
                    viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              <button
                className="w-32 rounded bg-[#4B5563] px-4 py-2 text-sm text-gray-300 hover:bg-[#374151]"
                onClick={() => {}}>
                RUN TESTS
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
