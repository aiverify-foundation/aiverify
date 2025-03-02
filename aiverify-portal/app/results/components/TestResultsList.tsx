'use client';

import { RiArrowLeftLine } from '@remixicon/react';
import { RiArrowRightLine } from '@remixicon/react';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { TestResult } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Button } from '@/lib/components/TremurButton';
import ResultsFilters from './FilterButtons';
import SplitPane from './SplitPane';
import TestResultsCard from './TestResultsCard';
import TestResultDetail from './TestResultsDetail';

type Props = {
  flow?: UserFlows;
  projectId?: string;
  testResults: TestResult[];
  enableSelection?: boolean;
  onSelectResult?: (result: TestResult) => void;
};

export default function TestResultsList({
  testResults,
  flow,
  projectId,
  enableSelection = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<number[]>([]);
  const [results, setResults] = useState<TestResult[]>(testResults); // State for the test results
  const resultIdsForCanvas = selectedResultIds.join(',');
  let updatedFlow = flow;
  if (flow === UserFlows.NewProjectWithExistingTemplate) {
    updatedFlow = UserFlows.NewProjectWithExistingTemplateAndResults;
  } else if (flow === UserFlows.NewProjectWithNewTemplate) {
    updatedFlow = UserFlows.NewProjectWithNewTemplateAndResults;
  }

  const fuse = useMemo(() => {
    const options = {
      keys: [
        'name',
        'cid',
        'gid',
        'version',
        'testArguments.testDataset',
        'testArguments.modelType',
        'testArguments.groundTruthDataset',
        'testArguments.groundTruth',
        'testArguments.algorithmArgs',
        'testArguments.modelFile',
        'output',
      ],
      includeScore: true,
      threshold: 0.7, // lower threshold = more accurate
    };
    return new Fuse(testResults, options);
  }, [testResults]);

  const filteredResults = useMemo(() => {
    // no search query, return all the results
    let searchResults = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : results;

    // if filtering selected
    if (activeFilter) {
      searchResults = searchResults.filter(
        (result) =>
          result.testArguments.modelType === activeFilter.toLowerCase() ||
          result.cid === activeFilter.toLowerCase()
      );
    }

    // if sorting selected
    if (sortBy === 'date-asc') {
      searchResults = searchResults.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortBy === 'date-desc') {
      searchResults = searchResults.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === 'name') {
      searchResults = searchResults.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return searchResults;
  }, [searchQuery, activeFilter, sortBy, fuse, results]);

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filter: string) => setActiveFilter(filter);
  const handleSort = (newSortBy: string) => setSortBy(newSortBy);

  const handleSelectResult = (result: TestResult) => {
    if (selectedResult?.id === result.id) {
      setSelectedResult(null);
    } else {
      setSelectedResult(result);
    }
  };

  const handleUpdateResult = (updatedResult: TestResult) => {
    setResults((prevResults) =>
      prevResults.map((result) =>
        result.id === updatedResult.id
          ? { ...result, name: updatedResult.name }
          : result
      )
    );
  };

  const handleCheckboxChange = (resultId: number) => (checked: boolean) => {
    if (checked) {
      const checkedTextResult = testResults.find(
        (result) => result.id === resultId
      );
      if (checkedTextResult) {
        setSelectedResultIds((prevResults) => [
          ...prevResults,
          checkedTextResult.id,
        ]);
      }
    } else {
      setSelectedResultIds((prevResults) =>
        prevResults.filter((id) => id !== resultId)
      );
    }
  };

  return selectedResult ? (
    <SplitPane
      leftPane={
        <div className="flex h-full flex-col">
          <ResultsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            activeFilter={activeFilter}
            isSplitPaneActive={true}
          />
          <div className="mt-2 flex-1 overflow-y-auto p-1 scrollbar-hidden">
            {filteredResults.map((result) => (
              <TestResultsCard
                key={result.id}
                onClick={() => handleSelectResult(result)}
                result={result}
                checked={selectedResultIds.includes(result.id)}
                enableCheckbox={enableSelection}
                onCheckboxChange={handleCheckboxChange(result.id)}
                isSplitPaneActive={true}
              />
            ))}
          </div>
        </div>
      }
      rightPane={
        <div>
          <TestResultDetail
            result={selectedResult}
            onUpdateResult={handleUpdateResult}
          />
          {flow === UserFlows.NewProjectWithExistingTemplate ||
          flow === UserFlows.NewProjectWithNewTemplate ? (
            <section className="mt-20 flex items-center justify-end gap-4">
              <Link
                href={`/project/usermenu?flow=${flow}&projectId=${projectId}`}>
                <Button
                  className="w-[130px] gap-4 p-2 text-white"
                  variant="secondary">
                  <RiArrowLeftLine /> Back
                </Button>
              </Link>
              {resultIdsForCanvas.length > 0 ? (
                <Link
                  href={`/canvas?flow=${updatedFlow}&projectId=${projectId}&testResultIds=${resultIdsForCanvas}`}>
                  <Button
                    className="w-[130px] gap-4 p-2 text-white"
                    variant="secondary">
                    Next <RiArrowRightLine />
                  </Button>
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>
      }
    />
  ) : (
    <div>
      <ResultsFilters
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        activeFilter={activeFilter}
        isSplitPaneActive={false}
      />
      <div className="mt-6">
        {filteredResults.map((result) => (
          <TestResultsCard
            key={result.id}
            onClick={() => handleSelectResult(result)}
            result={result}
            checked={selectedResultIds.includes(result.id)}
            enableCheckbox={enableSelection}
            onCheckboxChange={handleCheckboxChange(result.id)}
            isSplitPaneActive={false}
          />
        ))}
      </div>
      {flow === UserFlows.NewProjectWithExistingTemplate ||
      flow === UserFlows.NewProjectWithNewTemplate ? (
        <section className="mt-20 flex items-center justify-end gap-4">
          <Link href={`/project/usermenu?flow=${flow}&projectId=${projectId}`}>
            <Button
              className="w-[130px] gap-4 p-2 text-white"
              variant="secondary">
              <RiArrowLeftLine /> Back
            </Button>
          </Link>
          {resultIdsForCanvas.length > 0 ? (
            <Link
              href={`/canvas?flow=${updatedFlow}&projectId=${projectId}&testResultIds=${resultIdsForCanvas}`}>
              <Button
                className="w-[130px] gap-4 p-2 text-white"
                variant="secondary">
                Next <RiArrowRightLine />
              </Button>
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
