import { render } from '@testing-library/react';
import React from 'react';
import ProgressBar from '../ProgressSidebar';
import { InputBlockGroup } from '@/app/inputs/utils/types';
import { InputBlock } from '@/app/types';
import { useMDXSummaryBundle } from '../../../../[groupId]/hooks/useMDXSummaryBundle';
import { useChecklists } from '../../../context/ChecklistsContext';

jest.mock('../../../../[groupId]/hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: jest.fn(),
}));

jest.mock('../../../context/ChecklistsContext', () => ({
  useChecklists: jest.fn(),
}));

jest.mock('../../../../[groupId]/utils/icons', () => ({
  CheckCircleIcon: () => <svg data-testid="check-circle-icon" />,
  WarningCircleIcon: () => <svg data-testid="warning-circle-icon" />,
}));

jest.mock('react/jsx-runtime', () => {
  const React = require('react');
  return {
    jsx: jest.fn(),
    jsxs: jest.fn(),
    Fragment: React.Fragment,
  };
});

const mockUseMDXSummaryBundle = useMDXSummaryBundle as jest.MockedFunction<typeof useMDXSummaryBundle>;
const mockUseChecklists = useChecklists as jest.MockedFunction<typeof useChecklists>;

const mockInputBlock: InputBlock = {
  gid: 'test.gid',
  cid: 'test.cid',
  name: 'Test Input Block',
  description: 'Test Description',
  group: 'test-group',
  width: 'md',
  mdxContent: 'test content',
  version: '1.0.0',
  author: 'Test Author',
  tags: 'test, tags',
  groupNumber: 1,
  fullScreen: false,
};

const mockGroup: InputBlockGroup = {
  gid: 'test.gid',
  groupName: 'Test Group',
  inputBlocks: [mockInputBlock],
  data: {
    'test.cid': 'test-data',
  },
};

const defaultMockChecklists: any[] = [
  {
    gid: 'test.gid',
    cid: 'checklist1',
    name: 'Checklist 1',
    group: 'test-group',
    data: { 'completed-1': 'Yes' },
    id: 1,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
];

describe('ProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChecklists.mockReturnValue({
      checklists: defaultMockChecklists,
      groupName: '',
      selectedChecklist: null,
      isLoading: false,
      error: null,
      setGroupName: jest.fn(),
      setSelectedChecklist: jest.fn(),
      updateChecklistData: jest.fn(),
      clearAllChecklists: jest.fn(),
      setChecklists: jest.fn(),
      checkForExistingData: jest.fn(),
      clearGroupName: jest.fn(),
    });
    mockUseMDXSummaryBundle.mockReturnValue({
      data: { code: 'return { progress: () => 100 }' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      status: 'success',
      fetchStatus: 'idle',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);
  });

  it('handles group with null data', () => {
    const groupWithNullData: InputBlockGroup = {
      ...mockGroup,
      data: null as any,
    };
    expect(() => render(<ProgressBar group={groupWithNullData} />)).not.toThrow();
  });

  it('handles input block with missing data', () => {
    const groupWithMissingData: InputBlockGroup = {
      ...mockGroup,
      data: {},
    };
    expect(() => render(<ProgressBar group={groupWithMissingData} />)).not.toThrow();
  });

  it('handles very large number of input blocks', () => {
    const manyInputBlocks = Array.from({ length: 100 }, (_, index) => ({
      ...mockInputBlock,
      cid: `block${index}`,
      name: `Block ${index}`,
    }));
    const groupWithManyBlocks: InputBlockGroup = {
      ...mockGroup,
      inputBlocks: manyInputBlocks,
    };
    expect(() => render(<ProgressBar group={groupWithManyBlocks} />)).not.toThrow();
  });

  it('handles loading state from useMDXSummaryBundle', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isFetching: false,
      isRefetching: false,
      status: 'loading',
      fetchStatus: 'idle',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: false,
      isFetchedAfterMount: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);
    expect(() => render(<ProgressBar group={mockGroup} />)).not.toThrow();
  });

  it('handles error state from useMDXSummaryBundle', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('MDX bundle error'),
      isError: true,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isFetching: false,
      isRefetching: false,
      status: 'error',
      fetchStatus: 'idle',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: new Error('MDX bundle error'),
      errorUpdateCount: 1,
      isFetched: false,
      isFetchedAfterMount: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);
    expect(() => render(<ProgressBar group={mockGroup} />)).not.toThrow();
  });
}); 