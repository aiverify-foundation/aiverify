'use client';

import {
  RiRefreshLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiDeleteBinLine,
  RiCloseLine,
} from '@remixicon/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import useCancelTestRun from '@/app/results/run/hooks/useCancelTestRun';
import useDeleteTestRun from '@/app/results/run/hooks/useDeleteTestRun';
import useGetTestRuns from '@/app/results/run/hooks/useGetTestRuns';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal/modal';
import { TestRunOutput } from '@/lib/fetchApis/getTestRunApis';
import FilterButtons from './FilterButtons';

export default function ActiveTestsList({ runs }: { runs: TestRunOutput[] }) {
  const [tests, setTests] = useState<TestRunOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(10); // seconds
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 5;

  // Use the Tanstack Query hook for fetching test runs
  const {
    data: testRunsData,
    refetch: refetchTestRuns,
    isError: isRefetchError,
    error: refetchError,
  } = useGetTestRuns({
    enabled: false, // Don't fetch on component mount, we'll use the server data first
  });

  // Delete test run functionality
  const { mutate: deleteTestRun, isPending: isDeleting } = useDeleteTestRun();

  // Use the cancel hook
  const { mutate: cancelTestRun, isPending: isCancelling } = useCancelTestRun();

  const statusFilters = [
    { id: 'pending', label: 'PENDING' },
    { id: 'running', label: 'RUNNING' },
    { id: 'success', label: 'SUCCESS' },
    { id: 'error', label: 'ERROR' },
    { id: 'cancelled', label: 'CANCELLED' },
  ];

  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);

  // Add this state to track which errors are expanded
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>(
    {}
  );

  // Add state for sorting
  const [sortOption, setSortOption] = useState<string>('date-desc'); // Default to newest to oldest

  // Sort options
  const sortOptions = [
    { value: 'name-asc', label: 'A to Z' },
    { value: 'name-desc', label: 'Z to A' },
  ];

  // Add state for algorithm filter
  const [algorithmFilter, setAlgorithmFilter] = useState<string>('all');

  // Add state for delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Add state for cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [testToCancel, setTestToCancel] = useState<string | null>(null);

  // Add state for success modals
  const [deleteSuccessModalOpen, setDeleteSuccessModalOpen] = useState(false);
  const [cancelSuccessModalOpen, setCancelSuccessModalOpen] = useState(false);

  // Initialize with server-provided data and set default filter to show all tests
  useEffect(() => {
    // Initialize with empty filter array to show all tests
    setActiveStatusFilters([]);

    if (runs) {
      setTests(runs);
      setLoading(false);
      setLastRefreshTime(new Date());
    }
  }, [runs]);

  // Update state when testRunsData changes from the hook
  useEffect(() => {
    if (testRunsData) {
      setTests(testRunsData);
      setLastRefreshTime(new Date());
    }
  }, [testRunsData]);

  // Update error state when refetch error occurs
  useEffect(() => {
    if (isRefetchError && refetchError) {
      setError(`Failed to load test runs: ${refetchError.message}`);
    } else if (!isRefetchError) {
      setError(null);
    }
  }, [isRefetchError, refetchError]);

  // Function to fetch fresh data from API without reloading the page
  const fetchTests = async () => {
    setLoading(true);
    try {
      await refetchTestRuns();
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

    // should track the rate of progress and calculate this more accurately
    return 'A few minutes';
  };

  // Get unique algorithm names for dropdown
  const getUniqueAlgorithmOptions = () => {
    if (!tests.length) return [{ value: 'all', label: 'All Algorithms' }];

    const algorithmNames = tests.map((test) => ({
      value: test.algorithmGID,
      label: getAlgorithmName(test.algorithmGID, test.algorithmCID),
    }));

    // Remove duplicates by converting to Set and back to array
    const uniqueNames = Array.from(
      new Map(algorithmNames.map((item) => [item.label, item])).values()
    );

    // Add "All" option at the beginning
    return [{ value: 'all', label: 'All Algorithms' }, ...uniqueNames];
  };

  // Helper function to get the display status
  const getDisplayStatus = (test: TestRunOutput) => {
    if (test.status === 'pending' && test.progress > 0) {
      return 'running';
    }
    return test.status;
  };

  // Combined filtering function
  const getFilteredTests = () => {
    let filtered = tests;

    // Filter by status if active filters exist
    if (activeStatusFilters.length > 0) {
      filtered = filtered.filter((test) => {
        const displayStatus = getDisplayStatus(test);
        return activeStatusFilters.includes(displayStatus);
      });
    }

    // Filter by algorithm if not set to "all"
    if (algorithmFilter !== 'all') {
      filtered = filtered.filter(
        (test) => test.algorithmGID === algorithmFilter
      );
    }

    return filtered;
  };

  // Apply filtering
  const filteredTests = getFilteredTests();

  // Function to sort tests based on selected sort option
  const getSortedTests = (tests: TestRunOutput[]) => {
    const sortedTests = [...tests];

    // Fallback to using the array index if date properties are not available
    switch (sortOption) {
      case 'name-asc':
        // Sort by algorithm name (A to Z)
        return sortedTests.sort((a, b) =>
          getAlgorithmName(a.algorithmGID, a.algorithmCID).localeCompare(
            getAlgorithmName(b.algorithmGID, b.algorithmCID)
          )
        );
      case 'name-desc':
        // Sort by algorithm name (Z to A)
        return sortedTests.sort((a, b) =>
          getAlgorithmName(b.algorithmGID, b.algorithmCID).localeCompare(
            getAlgorithmName(a.algorithmGID, a.algorithmCID)
          )
        );
      default:
        return sortedTests;
    }
  };

  // Apply sorting to the filtered tests
  const sortedFilteredTests = getSortedTests(filteredTests);

  // Calculate pagination for filtered tests
  const indexOfLastTest = currentPage * testsPerPage;
  const indexOfFirstTest = indexOfLastTest - testsPerPage;
  const currentTests = sortedFilteredTests.slice(
    indexOfFirstTest,
    indexOfLastTest
  );

  // Calculate total pages based on filtered tests
  const totalPages = Math.ceil(sortedFilteredTests.length / testsPerPage);

  // Function to handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusFilterClick = (statusId: string) => {
    const newFilters = [...activeStatusFilters];
    const index = newFilters.indexOf(statusId);

    if (index === -1) {
      newFilters.push(statusId);
    } else {
      newFilters.splice(index, 1);
    }

    // Reset to first page when filters change
    setCurrentPage(1);
    setActiveStatusFilters(newFilters);
  };

  // Function to toggle error expansion
  const toggleErrorExpand = (testId: string) => {
    setExpandedErrors((prev) => ({
      ...prev,
      [testId]: !prev[testId],
    }));
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Handle algorithm filter change
  const handleAlgorithmFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setAlgorithmFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Function to handle test deletion
  const handleDeleteTest = async (testId: string) => {
    // Open the modal for confirmation
    setTestToDelete(testId);
    setDeleteModalOpen(true);
  };

  // Function to confirm test deletion
  const confirmDeleteTest = async () => {
    if (!testToDelete) return;

    try {
      await deleteTestRun(testToDelete);
      // Close the confirmation modal
      setDeleteModalOpen(false);
      // Show success modal
      setDeleteSuccessModalOpen(true);
    } catch (error) {
      console.error('Error deleting test run:', error);
      // Close the confirmation modal even on error
      setDeleteModalOpen(false);
    } finally {
      setTestToDelete(null);
    }
  };

  // Function to handle delete success modal close
  const handleDeleteSuccessClose = () => {
    setDeleteSuccessModalOpen(false);
    // Refetch test data
    fetchTests();
  };

  // Function to cancel test deletion
  const cancelDeleteTest = () => {
    setDeleteModalOpen(false);
    setTestToDelete(null);
  };

  // Function to handle test cancellation
  const handleCancelTest = (testId: string) => {
    // Open the modal for confirmation
    setTestToCancel(testId);
    setCancelModalOpen(true);
  };

  // Function to confirm test cancellation
  const confirmCancelTest = async () => {
    if (!testToCancel) return;

    try {
      await cancelTestRun(testToCancel);
      // Close the confirmation modal
      setCancelModalOpen(false);
      // Show success modal
      setCancelSuccessModalOpen(true);
    } catch (error) {
      console.error('Error cancelling test run:', error);
      // Close the confirmation modal even on error
      setCancelModalOpen(false);
    } finally {
      setTestToCancel(null);
    }
  };

  // Function to handle cancel success modal close
  const handleCancelSuccessClose = () => {
    setCancelSuccessModalOpen(false);
    // Refetch test data
    fetchTests();
  };

  // Function to cancel test cancellation
  const cancelCancelTest = () => {
    setCancelModalOpen(false);
    setTestToCancel(null);
  };

  return (
    <div>
      <div className="flex items-center justify-end">
        <div className="mr-4 text-xs text-gray-400">
          Last updated: {getTimeSinceLastRefresh()}
        </div>
        <div className="text-xs text-white">
          Auto-refresh:
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="ml-2 rounded bg-secondary-800 p-1 text-white">
            <option value={60}>1m</option>
            <option value={60 * 5}>5m</option>
            <option value={60 * 10}>10m</option>
            <option value={60 * 15}>15m</option>
          </select>
        </div>
        <div
          className={`inline-flex items-center justify-center rounded ${loading ? 'animate-spin' : ''} cursor-pointer p-2 ${loading ? 'opacity-50' : ''}`}
          onClick={!loading ? fetchTests : undefined}
          role="button"
          aria-disabled={loading}
          tabIndex={0}>
          <RiRefreshLine className="text-white" />
        </div>
      </div>
      <div className="rounded-lg bg-secondary-950 p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="mr-4 flex items-center">
            <label
              htmlFor="algorithm-filter"
              className="mr-2 text-sm text-gray-400">
              Algorithm:
            </label>
            <select
              id="algorithm-filter"
              value={algorithmFilter}
              onChange={handleAlgorithmFilterChange}
              className="rounded bg-secondary-800 px-2 py-1 text-sm text-white">
              {getUniqueAlgorithmOptions().map((option) => (
                <option
                  key={option.value}
                  value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FilterButtons
            statusFilters={statusFilters}
            activeStatusFilters={activeStatusFilters}
            onFilterClick={handleStatusFilterClick}
          />
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
        ) : sortedFilteredTests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-3xl text-gray-400">No Tests Found</div>
            <p className="mb-6 text-gray-500">
              {activeStatusFilters.length > 0
                ? `No tests with status: ${activeStatusFilters.join(', ')}`
                : 'There are currently no tests available.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/results/run">
                <Button
                  pill
                  variant={ButtonVariant.PRIMARY}
                  text="RUN A NEW TEST"
                  size="md"
                />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-hidden rounded-lg border border-secondary-800">
              {currentTests.map((test, index) => (
                <div
                  key={test.id}
                  className={`flex flex-col border-b border-secondary-800 p-4 ${
                    index % 2 === 0 ? 'bg-secondary-900' : 'bg-secondary-950'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 flex-col">
                      <div className="mb-1 flex items-center">
                        <span className="mr-2 text-lg font-medium text-white">
                          {getAlgorithmName(
                            test.algorithmGID,
                            test.algorithmCID
                          )}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            test.status === 'pending' && test.progress === 0
                              ? 'bg-yellow-200 text-yellow-800'
                              : test.status === 'pending' && test.progress > 0
                                ? 'bg-blue-200 text-blue-800'
                                : test.status === 'success'
                                  ? 'bg-green-200 text-green-800'
                                  : test.status === 'error'
                                    ? 'bg-red-200 text-red-800'
                                    : test.status === 'cancelled'
                                      ? 'bg-gray-200 text-gray-700'
                                      : 'bg-gray-200 text-gray-800'
                          }`}>
                          {test.status === 'pending' && test.progress > 0 ? 'RUNNING' : test.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <span>ID: {test.id.slice(0, 8)}...</span> •
                        <span className="ml-2">
                          Model: {test.modelFilename}
                        </span>{' '}
                        •
                        <span className="ml-2">
                          Dataset: {test.testDatasetFilename}
                        </span>
                      </div>
                    </div>
                    <div className="flex">
                      {/* Show cancel button for pending tests (both true pending and running) */}
                      {test.status === 'pending' && (
                        <button
                          onClick={() => handleCancelTest(test.id)}
                          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-800 p-1 text-gray-400 transition-colors hover:bg-yellow-700 hover:text-white"
                          disabled={isCancelling}
                          title="Cancel test run"
                          aria-label="Cancel test run">
                          <RiCloseLine className="h-4 w-4" />
                        </button>
                      )}
                      {/* Only show delete button for tests that are not pending */}
                      {test.status !== 'pending' && (
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-800 p-1 text-gray-400 transition-colors hover:bg-red-800 hover:text-white"
                            disabled={isDeleting}
                            title="Delete test run"
                            aria-label="Delete test run">
                            <RiDeleteBinLine className="h-4 w-4" />
                          </button>
                        )}
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
                        {test.status === 'pending' &&
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
                        className={`h-2 rounded-full transition-all duration-300 ease-in-out ${
                          test.status === 'pending' && test.progress === 0
                            ? 'bg-yellow-500'
                            : test.status === 'pending' && test.progress > 0
                              ? 'bg-primary-500'
                              : test.status === 'success'
                                ? 'bg-green-500'
                                : test.status === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                        } ${test.progress > 0 ? '' : 'animate-pulse'}`}
                        style={{
                          width: `${test.progress === 0 ? 5 : test.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Add visual indicator for real-time updates */}
                  {test.status === 'pending' && test.progress > 0 && (
                    <div className="mt-1 flex items-center">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                      <span className="ml-1 text-xs text-blue-300">
                        Updating in real-time
                      </span>
                    </div>
                  )}

                  {/* Error messages if any */}
                  {test.errorMessages && (
                    <div className="mt-2 rounded border border-red-800 bg-red-900 bg-opacity-30 p-2">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => toggleErrorExpand(test.id)}
                          className="flex items-center text-xs text-red-300 hover:text-red-100 focus:outline-none"
                          aria-expanded={expandedErrors[test.id]}
                          aria-controls={`error-content-${test.id}`}>
                          {expandedErrors[test.id] ? (
                            <>
                              Hide Error <RiArrowUpSLine className="ml-1" />
                            </>
                          ) : (
                            <>
                              View Error <RiArrowDownSLine className="ml-1" />
                            </>
                          )}
                        </button>
                      </div>
                      {expandedErrors[test.id] && (
                        <div
                          id={`error-content-${test.id}`}
                          className="mt-2 whitespace-pre-wrap break-words text-xs text-red-300">
                          Error: {test.errorMessages}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination and Sorting Controls */}
            <div className="mt-4 flex items-center justify-between">
              {/* Sorting Controls */}
              <div className="flex items-center">
                <label
                  htmlFor="sort-select"
                  className="mr-2 text-sm text-gray-400">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortOption}
                  onChange={handleSortChange}
                  className="rounded bg-secondary-800 px-2 py-1 text-sm text-white">
                  {sortOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="mx-1 rounded bg-secondary-800 px-3 py-1 text-white disabled:opacity-50">
                  Previous
                </button>
                <span className="mx-2 text-white">
                  Page {currentPage} of {totalPages} (
                  {sortedFilteredTests.length} total)
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="mx-1 rounded bg-secondary-800 px-3 py-1 text-white disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add CSS for spinning animation */}
        <style jsx>{`
          .animate-spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <Modal
          heading="Confirm Delete"
          enableScreenOverlay={true}
          onCloseIconClick={cancelDeleteTest}
          primaryBtnLabel="Delete"
          secondaryBtnLabel="Cancel"
          onPrimaryBtnClick={confirmDeleteTest}
          onSecondaryBtnClick={cancelDeleteTest}>
          <div className="mt-4 text-white">
            <p>Are you sure you want to delete this test run?</p>
            <p className="mt-2 text-sm text-gray-300">
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {/* Delete success modal */}
      {deleteSuccessModalOpen && (
        <Modal
          heading="Test Deleted"
          enableScreenOverlay={true}
          onCloseIconClick={handleDeleteSuccessClose}
          primaryBtnLabel="OK"
          onPrimaryBtnClick={handleDeleteSuccessClose}>
          <div className="mt-4 text-white">
            <p>The test run has been successfully deleted.</p>
          </div>
        </Modal>
      )}

      {/* Cancel confirmation modal */}
      {cancelModalOpen && (
        <Modal
          heading="Confirm Cancellation"
          enableScreenOverlay={true}
          onCloseIconClick={cancelCancelTest}
          primaryBtnLabel="Cancel Test"
          secondaryBtnLabel="Keep Running"
          onPrimaryBtnClick={confirmCancelTest}
          onSecondaryBtnClick={cancelCancelTest}>
          <div className="mt-4 text-white">
            <p>Are you sure you want to cancel this test run?</p>
            <p className="mt-2 text-sm text-gray-300">
              The test will be stopped and marked as cancelled.
            </p>
          </div>
        </Modal>
      )}

      {/* Cancel success modal */}
      {cancelSuccessModalOpen && (
        <Modal
          heading="Test Cancelled"
          enableScreenOverlay={true}
          onCloseIconClick={handleCancelSuccessClose}
          primaryBtnLabel="OK"
          onPrimaryBtnClick={handleCancelSuccessClose}>
          <div className="mt-4 text-white">
            <p>The test run has been successfully cancelled.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
