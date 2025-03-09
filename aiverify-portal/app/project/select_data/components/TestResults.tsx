'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TestModel } from '@/app/models/utils/types';
import { Algorithm, TestResult } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Button, ButtonVariant } from '@/lib/components/button';

interface TestResultsProps {
  projectId: string;
  requiredAlgorithms: Algorithm[];
  onTestResultsChange: (
    testResults: Array<{ gid: string; cid: string; id: number }>
  ) => void;
  allTestResults: TestResult[];
  selectedModel?: TestModel;
  flow: string;
}

export default function TestResults({
  projectId,
  requiredAlgorithms,
  onTestResultsChange,
  allTestResults,
  selectedModel,
  flow,
}: TestResultsProps) {
  const [selectedTestResults, setSelectedTestResults] = useState<
    Array<{ gid: string; cid: string; id: number }>
  >([]);

  const getTestResultsForAlgorithm = (algorithm: Algorithm) => {
    return allTestResults.filter(
      (result) =>
        result.gid === algorithm.gid &&
        result.cid === algorithm.cid &&
        (!selectedModel ||
          result.testArguments.modelFile === selectedModel.name)
    );
  };

  const handleTestResultChange = (
    algorithm: Algorithm,
    testResultId: number | undefined
  ) => {
    const newSelectedTestResults = selectedTestResults.filter(
      (result) => result.gid !== algorithm.gid || result.cid !== algorithm.cid
    );

    if (testResultId !== undefined) {
      const testResult = allTestResults.find(
        (result) => result.id === testResultId
      );
      if (testResult) {
        newSelectedTestResults.push({
          gid: testResult.gid,
          cid: testResult.cid,
          id: testResult.id,
        });
      }
    }

    setSelectedTestResults(newSelectedTestResults);
    onTestResultsChange(newSelectedTestResults);
  };

  return (
    <div className="rounded-lg border border-secondary-500 bg-secondary-950 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Test Results
          </h2>
          <p className="text-sm text-gray-400">
            Select test results for each required algorithm. Only test results
            matching the selected model will be shown.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requiredAlgorithms.map((algorithm) => {
          const testResults = getTestResultsForAlgorithm(algorithm);
          const selectedTestResult = selectedTestResults.find(
            (result) =>
              result.gid === algorithm.gid && result.cid === algorithm.cid
          );

          return (
            <div
              key={`${algorithm.gid}-${algorithm.cid}`}
              className="flex items-center justify-between gap-4">
              <label className="w-64 text-white">{algorithm.name}</label>
              <div className="relative flex-1">
                <select
                  className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-white"
                  value={selectedTestResult?.id || ''}
                  onChange={(e) =>
                    handleTestResultChange(
                      algorithm,
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }>
                  <option value="">Choose Test Results</option>
                  {testResults.map((result) => (
                    <option
                      key={result.id}
                      value={result.id}>
                      {result.name} -{' '}
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
              <Button
                variant={ButtonVariant.OUTLINE}
                hoverColor="var(--color-primary-500)"
                textColor="white"
                text="RUN TESTS"
                size="xs"
                pill
                onClick={() => {}}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Link href={`/results/upload?flow=${flow}&projectId=${projectId}`}>
          <Button
            variant={ButtonVariant.OUTLINE}
            hoverColor="var(--color-primary-500)"
            textColor="white"
            text="UPLOAD TEST RESULTS"
            size="xs"
            pill
          />
        </Link>
      </div>
    </div>
  );
}
