import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChecklist } from '../useChecklist';

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

describe('useChecklist', () => {
  const mockChecklistData = {
    gid: 'test-gid',
    cid: 'test-cid',
    name: 'Test Checklist',
    group: 'Test Group',
    data: { key1: 'value1', key2: 'value2' },
    id: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch checklist data successfully', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChecklistData,
    } as Response);

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1');
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalledWith('response', expect.any(Object));
    
    // Verify data is correct
    expect(result.current.data).toEqual(mockChecklistData);
  });

  it('should handle fetch error when response is not ok', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1');
    
    // Verify error message
    expect(result.current.error?.message).toBe('Failed to fetch checklist data');
  });

  it('should handle network error', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1');
    
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

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1');
    
    // Verify error message
    expect(result.current.error?.message).toBe('Invalid JSON');
  });

  it('should handle different checklist IDs', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockChecklistData, id: 2 }),
    } as Response);

    const { result } = renderHook(() => useChecklist('2'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/2');
    
    // Verify data is correct
    expect(result.current.data?.id).toBe(2);
  });

  it('should handle empty string ID', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChecklistData,
    } as Response);

    const { result } = renderHook(() => useChecklist(''), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with empty ID
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/');
  });

  it('should handle special characters in ID', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChecklistData,
    } as Response);

    const { result } = renderHook(() => useChecklist('test-id-with-special-chars!@#'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with special characters
    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/test-id-with-special-chars!@#');
  });

  it('should handle 500 server error', async () => {
    // Mock 500 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to fetch checklist data');
  });

  it('should handle 403 forbidden error', async () => {
    // Mock 403 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to fetch checklist data');
  });

  it('should handle loading state', () => {
    // Mock delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => mockChecklistData,
          } as Response);
        }, 100);
      })
    );

    const { result } = renderHook(() => useChecklist('1'), {
      wrapper: createWrapper(),
    });

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should handle query key correctly', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChecklistData,
    } as Response);

    const { result } = renderHook(() => useChecklist('test-id'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the query key is set correctly
    expect(result.current.data).toEqual(mockChecklistData);
  });
}); 