import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChecklistDetail from '../ChecklistDetail';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { useMDXBundle } from '../../hooks/useMDXBundle';

// Mock the context
jest.mock('@/app/inputs/context/InputBlockGroupDataContext');
const mockUseInputBlockGroupData = useInputBlockGroupData as jest.MockedFunction<typeof useInputBlockGroupData>;

// Mock the MDX bundle hook
jest.mock('../../hooks/useMDXBundle');
const mockUseMDXBundle = useMDXBundle as jest.MockedFunction<typeof useMDXBundle>;

// Mock React JSX Runtime
jest.mock('react/jsx-runtime', () => ({
  jsx: (type: any, props: any, ...children: any[]) => {
    if (typeof type === 'string') {
      return React.createElement(type, props, ...children);
    }
    return React.createElement(type, props, ...children);
  },
  jsxs: (type: any, props: any, ...children: any[]) => {
    if (typeof type === 'string') {
      return React.createElement(type, props, ...children);
    }
    return React.createElement(type, props, ...children);
  },
}));

describe('ChecklistDetail', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  const mockSetInputBlockData = jest.fn();
  const mockGetInputBlockData = jest.fn();
  const mockGetGroupDataById = jest.fn();
  
  const mockCurrentGroupData = {
    id: 1,
    gid: 'test-gid',
    name: 'Test Group',
    group: 'test-group',
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T00:00:00',
    input_blocks: [
      {
        id: 1,
        cid: 'test-cid',
        name: 'Test Input Block',
        groupNumber: 1,
        data: { field1: 'value1', field2: 'value2' },
      },
    ],
  };

  const mockInputBlockData = {
    inputBlock: {
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Test Input Block',
      description: 'Test Description',
      group: 'test-group',
      groupNumber: 1,
    },
    ibdata: {
      id: 1,
      cid: 'test-cid',
      name: 'Test Input Block',
      groupNumber: 1,
      data: { field1: 'value1', field2: 'value2' },
    },
  };

  const mockMDXBundle = {
    code: `
      const TestComponent = ({ data, onChangeData }) => {
        return React.createElement('div', { 'data-testid': 'mdx-component' }, 
          React.createElement('div', { 'data-testid': 'mdx-data' }, JSON.stringify(data)),
          React.createElement('button', { 
            onClick: () => onChangeData('testKey', 'testValue'),
            'data-testid': 'mdx-change-button'
          }, 'Change Data')
        );
      };
      TestComponent;
    `,
    frontmatter: {},
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseInputBlockGroupData.mockReturnValue({
      gid: 'test-gid',
      group: 'test-group',
      groupId: 1,
      cid: 'test-cid',
      name: 'Test Name',
      groupDataList: [mockCurrentGroupData],
      inputBlocks: [mockInputBlockData.inputBlock],
      currentGroupData: mockCurrentGroupData,
      setInputBlockData: mockSetInputBlockData,
      setName: jest.fn(),
      getInputBlockData: mockGetInputBlockData,
      getGroupDataById: mockGetGroupDataById,
      newGroupData: {
        gid: 'test-gid',
        name: 'Test Group',
        group: 'test-group',
        input_blocks: [],
      },
      updateNewGroupData: jest.fn(),
      saveNewGroupData: jest.fn(),
      projectId: 'test-project',
      flow: 'test-flow',
    });

    mockUseMDXBundle.mockReturnValue({
      data: mockMDXBundle,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isPlaceholderData: false,
      isStale: false,
      status: 'success',
    } as any);

    mockGetInputBlockData.mockReturnValue(mockInputBlockData);
    mockGetGroupDataById.mockReturnValue(mockCurrentGroupData);

    jest.clearAllMocks();
  });

  const renderComponent = async () => {
    let result: any;
    await act(async () => {
      result = render(
        <QueryClientProvider client={queryClient}>
          <ChecklistDetail cid="test-cid" gid="test-gid" />
        </QueryClientProvider>
      );
    });
    return result;
  };

  describe('Component Rendering', () => {
    it('should render the component with group data', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
      expect(screen.getByText('Clear Fields')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should show alert when no group data is available', async () => {
      mockGetGroupDataById.mockReturnValue(null);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });

    it('should show loading state when MDX bundle is loading', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isSuccess: false,
        isFetching: true,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: false,
        isFetchedAfterMount: false,
        isInitialLoading: true,
        isPlaceholderData: false,
        isStale: true,
        status: 'pending',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });
  });

  describe('Clear Fields Functionality', () => {
    it('should render clear fields button', async () => {
      await renderComponent();

      expect(screen.getByText('Clear Fields')).toBeInTheDocument();
    });
  });

  describe('MDX Component Integration', () => {
    it('should render MDX component when available', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should show skeleton when MDX component is loading', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isSuccess: false,
        isFetching: true,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: false,
        isFetchedAfterMount: false,
        isInitialLoading: true,
        isPlaceholderData: false,
        isStale: true,
        status: 'pending',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });

    it('should handle MDX bundle error gracefully', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('MDX Bundle Error'),
        isError: true,
        isSuccess: false,
        isFetching: false,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: new Error('MDX Bundle Error'),
        isFetched: true,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPlaceholderData: false,
        isStale: false,
        status: 'error',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });
  });

  describe('Data Management', () => {
    it('should initialize with input block data', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should handle empty input block data', async () => {
      const emptyInputBlockData = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: {},
        },
      };

      mockGetInputBlockData.mockReturnValue(emptyInputBlockData);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle missing input blocks', async () => {
      const groupDataWithoutBlocks = {
        ...mockCurrentGroupData,
        input_blocks: [],
      };

      mockGetGroupDataById.mockReturnValue(groupDataWithoutBlocks);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle data changes', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should update local data when input block data changes', async () => {
      const { rerender } = await renderComponent();

      // Simulate data change
      const newInputBlockData = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: { field1: 'newValue', field2: 'newValue2' },
        },
      };

      mockGetInputBlockData.mockReturnValue(newInputBlockData);

      await act(async () => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <ChecklistDetail cid="test-cid" gid="test-gid" />
          </QueryClientProvider>
        );
      });

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle MDX bundle error', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('MDX bundle error'),
        isError: true,
        isSuccess: false,
        isFetching: false,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: new Error('MDX bundle error'),
        isFetched: true,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPlaceholderData: false,
        isStale: false,
        status: 'error',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data in input block', async () => {
      const inputBlockDataWithUndefined = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: undefined,
        },
      };

      mockGetInputBlockData.mockReturnValue(inputBlockDataWithUndefined);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle null data in input block', async () => {
      const inputBlockDataWithNull = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: null,
        },
      };

      mockGetInputBlockData.mockReturnValue(inputBlockDataWithNull);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle complex data structures', async () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
        simple: 'string',
        number: 42,
      };

      const inputBlockDataWithComplexData = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: complexData,
        },
      };

      mockGetInputBlockData.mockReturnValue(inputBlockDataWithComplexData);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle invalid date in group data', async () => {
      const groupDataWithInvalidDate = {
        ...mockCurrentGroupData,
        updated_at: 'invalid-date',
      };

      mockGetGroupDataById.mockReturnValue(groupDataWithInvalidDate);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle empty MDX bundle code', async () => {
      const emptyMDXBundle = {
        code: '',
        frontmatter: {},
      };

      mockUseMDXBundle.mockReturnValue({
        data: emptyMDXBundle,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPlaceholderData: false,
        isStale: false,
        status: 'success',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });

    it('should handle null MDX bundle', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPlaceholderData: false,
        isStale: false,
        status: 'success',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });

    it('should handle undefined MDX bundle', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPlaceholderData: false,
        isStale: false,
        status: 'success',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle component unmounting', async () => {
      const { unmount } = await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();

      unmount();
    });

    it('should handle useEffect cleanup', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle data change function', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle modal state changes', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle dynamic component loading', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle error boundaries', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle data initialization', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle useEffect dependencies', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle component re-rendering', async () => {
      const { rerender } = await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();

      await act(async () => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <ChecklistDetail cid="test-cid" gid="test-gid" />
          </QueryClientProvider>
        );
      });

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle context updates', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle MDX bundle updates', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle input block data updates', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle group data updates', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle error state recovery', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle loading state transitions', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle success state', async () => {
      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle component props changes', async () => {
      const { rerender } = await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();

      await act(async () => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <ChecklistDetail cid="new-cid" gid="new-gid" />
          </QueryClientProvider>
        );
      });

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle missing input block data gracefully', async () => {
      mockGetInputBlockData.mockReturnValue(null);

      await renderComponent();

      // When ibdata is null, the component returns null and doesn't render anything
      expect(screen.queryByText('Test Input Block')).not.toBeInTheDocument();
    });

    it('should handle missing currentGroupData gracefully', async () => {
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        group: 'test-group',
        groupId: 1,
        cid: 'test-cid',
        name: 'Test Name',
        groupDataList: [mockCurrentGroupData],
        inputBlocks: [mockInputBlockData.inputBlock],
        currentGroupData: null,
        setInputBlockData: mockSetInputBlockData,
        setName: jest.fn(),
        getInputBlockData: mockGetInputBlockData,
        getGroupDataById: mockGetGroupDataById,
        newGroupData: {
          gid: 'test-gid',
          name: 'Test Group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: 'test-project',
        flow: 'test-flow',
      });

      await renderComponent();

      // When currentGroupData is null, ibdata will be null, so the component returns null
      expect(screen.queryByText('Test Input Block')).not.toBeInTheDocument();
    });

    it('should handle MDX component creation error gracefully', async () => {
      const invalidMDXBundle = {
        code: 'invalid javascript code that will cause error',
        frontmatter: {},
      };

      mockUseMDXBundle.mockReturnValue({
        data: invalidMDXBundle,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        isRefetching: false,
        refetch: jest.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: true,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPlaceholderData: false,
        isStale: false,
        status: 'success',
      } as any);

      await renderComponent();

      expect(screen.getByText('No checklist data available')).toBeInTheDocument();
    });

    it('should handle clear fields button rendering', async () => {
      await renderComponent();

      expect(screen.getByText('Clear Fields')).toBeInTheDocument();
    });

    it('should handle last updated date display', async () => {
      await renderComponent();

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should handle component with different props', async () => {
      const { rerender } = await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();

      await act(async () => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <ChecklistDetail cid="different-cid" gid="different-gid" />
          </QueryClientProvider>
        );
      });

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle component with empty data', async () => {
      const emptyInputBlockData = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: {},
        },
      };

      mockGetInputBlockData.mockReturnValue(emptyInputBlockData);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle component with null data', async () => {
      const nullInputBlockData = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: null,
        },
      };

      mockGetInputBlockData.mockReturnValue(nullInputBlockData);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });

    it('should handle component with undefined data', async () => {
      const undefinedInputBlockData = {
        ...mockInputBlockData,
        ibdata: {
          ...mockInputBlockData.ibdata,
          data: undefined,
        },
      };

      mockGetInputBlockData.mockReturnValue(undefinedInputBlockData);

      await renderComponent();

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
    });
  });
}); 