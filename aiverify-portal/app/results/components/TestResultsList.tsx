'use client';

import { useState, useMemo } from 'react';
import { TestResults } from '../../types';
import TestResultsCard from './TestResultsCard';
import ResultsFilters from './FilterButtons';
import TestResultDetail from './TestResultsDetail';
import SplitPane from './SplitPane';
import Fuse from 'fuse.js';

type Props = {
  testResults: TestResults[];
};

export default function TestResultsList({ testResults }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedResult, setSelectedResult] = useState<TestResults | null>(null);
  const [results, setResults] = useState<TestResults[]>(testResults); // State for the test results

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
        'output'
      ],
      includeScore: true,
      threshold: 0.7, // lower threshold = more accurate
    };
    return new Fuse(testResults, options);
  }, [testResults]);

  const filteredResults = useMemo(() => {
    // no search query, return all the results
    let searchResults = searchQuery
      ? fuse.search(searchQuery).map(result => result.item)
      : results;
  
    // if filtering selected
    if (activeFilter) {
      searchResults = searchResults.filter(result => 
        result.testArguments.modelType === activeFilter.toLowerCase() ||
        result.cid === activeFilter.toLowerCase()
      );
    }
  
    // if sorting selected
    if (sortBy === 'date-asc') {
      searchResults = searchResults.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'date-desc') {
      searchResults = searchResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'name') {
      searchResults = searchResults.sort((a, b) => a.name.localeCompare(b.name));
    }
  
    return searchResults;
  }, [searchQuery, activeFilter, sortBy, fuse, results]);  

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
            {filteredResults.map((result) => (
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
        {filteredResults.map((result) => (
          <div onClick={() => handleSelectResult(result)} key={result.id}>
            <TestResultsCard result={result} />
          </div>
        ))}
      </div>
    </div>
  );
}
