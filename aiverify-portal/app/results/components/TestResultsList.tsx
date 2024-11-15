'use client';

import { useState } from 'react';
import { TestResults } from '../../types';
import TestResultsCard from './TestResultsCard';
import ResultsFilters from './FilterButtons';
import TestResultDetail from './TestResultsDetail';
import SplitPane from './SplitPane';

type Props = {
  testResults: TestResults[];
};

export default function TestResultsList({ testResults }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedResult, setSelectedResult] = useState<TestResults | null>(null);
  const [results, setResults] = useState<TestResults[]>(testResults); // State for the test results

  const filteredResults = results.filter((result) => {
    const searchString = `
      ${result.name}
      ${result.cid}
      ${result.gid}
      ${result.version}
      ${result.testArguments.testDataset}
      ${result.testArguments.modelType}
      ${result.testArguments.groundTruthDataset}
      ${result.testArguments.groundTruth}
      ${result.testArguments.algorithmArgs}
      ${result.testArguments.modelFile}
      ${result.output}
    `.toLowerCase();
  
    return searchString.includes(searchQuery.toLowerCase());
  }).filter((result) => {
    if (!activeFilter) return true;
    return (
      result.testArguments.modelType === activeFilter.toLowerCase() ||
      result.cid === activeFilter.toLowerCase()
    );
  });

  const sortedResults = filteredResults.sort((a, b) => {
    if (sortBy === 'date-asc') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'date-desc') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filter: string) => setActiveFilter(filter);
  const handleSort = (newSortBy: string) => setSortBy(newSortBy);

  const handleSelectResult = (result: TestResults) => {
    if (selectedResult?.id === result.id) {
      setSelectedResult(null);
    } else {
      setSelectedResult(result);
    }
  };

  const handleUpdateResult = (updatedResult: TestResults) => {
    setResults((prevResults) =>
      prevResults.map((result) =>
        result.id === updatedResult.id ? { ...result, name: updatedResult.name } : result
      )
    );
  };

  return selectedResult ? (
    <SplitPane
      leftPane={
        <div className="h-full flex flex-col">
          <ResultsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            activeFilter={activeFilter}
            isSplitPaneActive={true}
          />
          <div className="flex-1 overflow-y-auto mt-2">
            {sortedResults.map((result) => (
              <div onClick={() => handleSelectResult(result)} key={result.id}>
                <TestResultsCard result={result} />
              </div>
            ))}
          </div>
        </div>
      }
      rightPane={<TestResultDetail result={selectedResult} onUpdateResult={handleUpdateResult} />}
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
        {sortedResults.map((result) => (
          <div onClick={() => handleSelectResult(result)} key={result.id}>
            <TestResultsCard result={result} />
          </div>
        ))}
      </div>
    </div>
  );
}
