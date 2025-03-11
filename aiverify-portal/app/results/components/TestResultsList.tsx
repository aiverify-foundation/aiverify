'use client';

import Fuse from 'fuse.js';
import { useState, useMemo } from 'react';
import { TestResult } from '@/app/types';
import ResultsFilters from './FilterButtons';
import SplitPane from './SplitPane';
import TestResultsCard from './TestResultsCard';
import TestResultDetail from './TestResultsDetail';

type Props = {
  testResults: TestResult[];
};

export default function TestResultsList({ testResults }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [results, setResults] = useState<TestResult[]>(testResults);

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
      threshold: 0.7,
    };
    return new Fuse(testResults, options);
  }, [testResults]);

  const filteredResults = useMemo(() => {
    let searchResults = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : results;

    if (activeFilter) {
      searchResults = searchResults.filter(
        (result) =>
          result.testArguments.modelType === activeFilter.toLowerCase() ||
          result.cid === activeFilter.toLowerCase()
      );
    }

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
            isSplitPaneActive={false}
          />
        ))}
      </div>
    </div>
  );
}
