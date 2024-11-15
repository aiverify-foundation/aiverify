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

  const filteredResults = testResults
    .filter((result) => result.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((result) => {
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
    // Close or open split pane by checking if the selected result is the same as the clicked result
    if (selectedResult?.id === result.id) {
      setSelectedResult(null); // Close
    } else {
      setSelectedResult(result); // Open
    }
  };

  return selectedResult ? (
    <SplitPane
      leftPane={
        <div className="h-full flex flex-col">
        {/* Fixed Header */}
        <div>
          <ResultsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            activeFilter={activeFilter}
            isSplitPaneActive={true} // Split pane is active
          />
        </div>
        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto mt-2">
          {sortedResults.map((result) => (
            <div onClick={() => handleSelectResult(result)} key={result.id}>
              <TestResultsCard result={result} />
            </div>
          ))}
        </div>
      </div>
      }
      rightPane={<TestResultDetail result={selectedResult} />}
    />
  ) : (
    <div>
      <ResultsFilters
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        activeFilter={activeFilter}
        isSplitPaneActive={false} // Split pane is not active
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
