import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useUpdateChecklist from '../useUpdateChecklist';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock the ChecklistsContext
jest.mock('@/app/inputs/context/ChecklistsContext', () => ({
  useChecklists: jest.fn(),
}));

const mockUseChecklists = require('@/app/inputs/context/ChecklistsContext').useChecklists;

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

describe('useUpdateChecklist', () => {
  const mockChecklists = [
    {
      id: 1,
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Test Checklist 1',
      group: 'Test Group',
      data: { key1: 'value1', key2: 'value2' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'test-gid',
      cid: 'test-cid-2',
      name: 'Test Checklist 2',
      group: 'Test Group',
      data: { key3: 'value3', key4: 'value4' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockSetChecklists = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error
    
    // Setup default mock for useChecklists
    mockUseChecklists.mockReturnValue({
      checklists: mockChecklists,
      setChecklists: mockSetChecklists,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update checklist successfully', async () => {
    const updateData = {
      data: { key1: 'updated-value1', key2: 'updated-value2' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 1,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    // Verify context was updated
    expect(mockSetChecklists).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          data: updateData.data,
        }),
        expect.objectContaining({
          id: 2,
          data: { key3: 'value3', key4: 'value4' },
        }),
      ])
    );
  });

  it('should handle mutation error when response is not ok', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');

    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith('Error updating checklist:', expect.any(Error));
  });

  it('should handle network error', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Network error');

    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith('Error updating checklist:', expect.any(Error));
  });

  it('should handle JSON parsing error', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock response with invalid JSON
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Invalid JSON');

    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith('Error updating checklist:', expect.any(Error));
  });

  it('should update checklist with different ID', async () => {
    const updateData = {
      data: { key3: 'updated-value3', key4: 'updated-value4' },
      name: 'Updated Checklist 2',
      group: 'Updated Group 2',
    };

    const mockResponseData = {
      id: 2,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '2', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/2', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    // Verify context was updated for the correct checklist
    expect(mockSetChecklists).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          data: { key1: 'value1', key2: 'value2' },
        }),
        expect.objectContaining({
          id: 2,
          data: updateData.data,
        }),
      ])
    );
  });

  it('should handle empty data object', async () => {
    const updateData = {
      data: {},
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 1,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with empty data
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  });

  it('should handle complex nested data', async () => {
    const updateData = {
      data: {
        nested: JSON.stringify({
          level1: {
            level2: 'deep-value',
          },
        }),
        array: JSON.stringify([1, 2, 3]),
        boolean: 'true',
        nullValue: 'null',
      },
      name: 'Complex Checklist',
      group: 'Complex Group',
    };

    const mockResponseData = {
      id: 1,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with complex data
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  });

  it('should handle 500 server error', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock 500 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle 403 forbidden error', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock 403 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle 404 not found error', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock 404 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to update checklist');
  });

  it('should handle loading state', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ id: 1, ...updateData, updated_at: '2023-01-02T00:00:00Z' }),
          } as Response);
        }, 100);
      })
    );

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Should be loading initially
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should handle empty string ID', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 0,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with empty ID
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  });

  it('should handle special characters in ID', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 1,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: 'test-id-with-special-chars!@#', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with special characters
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/test-id-with-special-chars!@#', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  });

  it('should handle checklist not found in context', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 999, // Non-existent ID
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '999', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify context was updated (should not change anything since ID doesn't exist)
    expect(mockSetChecklists).toHaveBeenCalledWith(mockChecklists);
  });

  it('should handle context with empty checklists array', async () => {
    // Mock context with empty checklists
    mockUseChecklists.mockReturnValue({
      checklists: [],
      setChecklists: mockSetChecklists,
    });

    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 1,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate({ id: '1', data: updateData });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify context was updated (should remain empty since ID doesn't exist)
    expect(mockSetChecklists).toHaveBeenCalledWith([]);
  });

  it('should handle mutation with onSuccess callback', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    const mockResponseData = {
      id: 1,
      ...updateData,
      updated_at: '2023-01-02T00:00:00Z',
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const onSuccessMock = jest.fn();

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation with onSuccess callback
    result.current.mutate({ id: '1', data: updateData }, { onSuccess: onSuccessMock });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify onSuccess callback was called
    expect(onSuccessMock).toHaveBeenCalledWith(mockResponseData, { id: '1', data: updateData }, undefined);
  });

  it('should handle mutation with onError callback', async () => {
    const updateData = {
      data: { key1: 'updated-value1' },
      name: 'Updated Checklist',
      group: 'Updated Group',
    };

    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    const onErrorMock = jest.fn();

    const { result } = renderHook(() => useUpdateChecklist(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation with onError callback
    result.current.mutate({ id: '1', data: updateData }, { onError: onErrorMock });

    // Wait for the mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify onError callback was called
    expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error), { id: '1', data: updateData }, undefined);
  });
}); 