import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChecklistMutation } from '../useChecklistMutation';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper component for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useChecklistMutation', () => {
  const mockUpdateData = {
    key1: 'updated-value1',
    key2: 'updated-value2',
  };

  const mockResponseData = {
    id: 1,
    data: mockUpdateData,
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should mutate checklist data successfully', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: mockUpdateData }),
    });

    // Verify response data
    expect(result.current.data).toEqual(mockResponseData);
  });

  it('should handle mutation error when response is not ok', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: mockUpdateData }),
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle network error', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: mockUpdateData }),
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should handle JSON parsing error', async () => {
    // Mock response with invalid JSON
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Invalid JSON');
  });

  it('should handle different checklist IDs', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockResponseData, id: 2 }),
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('2'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/2', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: mockUpdateData }),
    });
  });

  it('should handle empty data object', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    const emptyData = {};

    // Trigger mutation with empty data
    result.current.mutate(emptyData);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with empty data
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: emptyData }),
    });
  });

  it('should handle complex nested data', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    const complexData = {
      nested: JSON.stringify({
        level1: {
          level2: 'deep-value',
        },
      }),
      array: JSON.stringify([1, 2, 3]),
      boolean: 'true',
      nullValue: 'null',
    };

    // Trigger mutation with complex data
    result.current.mutate(complexData);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with complex data
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: complexData }),
    });
  });

  it('should handle 500 server error', async () => {
    // Mock 500 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle 403 forbidden error', async () => {
    // Mock 403 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle 404 not found error', async () => {
    // Mock 404 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle loading state', async () => {
    // Mock delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => mockResponseData,
          } as Response);
        }, 100);
      })
    );

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Should be loading initially
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should handle empty string ID', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useChecklistMutation(''), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with empty ID
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: mockUpdateData }),
    });
  });

  it('should handle special characters in ID', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useChecklistMutation('test-id-with-special-chars!@#'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate(mockUpdateData);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with special characters
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block/test-id-with-special-chars!@#', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: mockUpdateData }),
    });
  });

  it('should handle mutation with onSuccess callback', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const onSuccessMock = jest.fn();

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation with onSuccess callback
    result.current.mutate(mockUpdateData, { onSuccess: onSuccessMock });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify onSuccess callback was called
    expect(onSuccessMock).toHaveBeenCalledWith(mockResponseData, mockUpdateData, undefined);
  });

  it('should handle mutation with onError callback', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    const onErrorMock = jest.fn();

    const { result } = renderHook(() => useChecklistMutation('1'), {
      wrapper: createWrapper(),
    });

    // Trigger mutation with onError callback
    result.current.mutate(mockUpdateData, { onError: onErrorMock });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify onError callback was called
    expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error), mockUpdateData, undefined);
  });
}); 