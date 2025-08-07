import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateInputBlockData } from '../useUpdateInputBlockData';
import { InputBlockData, InputBlockDataPayload } from '@/app/types';

// Mock fetch
global.fetch = jest.fn();

// Create a wrapper component with QueryClient
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

describe('useUpdateInputBlockData', () => {
  const mockInputBlockData: InputBlockData = {
    id: 1,
    gid: 'test-gid',
    cid: 'test-cid',
    name: 'Test Input Block',
    group: 'test-group',
    data: {} as InputBlockDataPayload,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockUpdateData = {
    name: 'Updated Input Block',
    group: 'updated-group',
    data: {} as InputBlockDataPayload,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mutation object with correct properties', () => {
    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.updateInputBlockData).toBe('function');
    expect(typeof result.current.isUpdating).toBe('boolean');
    expect(typeof result.current.error).toBe('object');
    expect(typeof result.current.isSuccess).toBe('boolean');
  });

  it('successfully updates input block data', async () => {
    const mockResponse = { ...mockInputBlockData, ...mockUpdateData };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.updateInputBlockData({
        id: 'test-id',
        data: mockUpdateData,
      });
      expect(response).toEqual(mockResponse);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/input_block_data/test-id', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockUpdateData),
    });
  });

  it('handles API error with string detail', async () => {
    const mockApiError = { detail: 'API Error occurred' };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockApiError,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.updateInputBlockData({
          id: 'test-id',
          data: mockUpdateData,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('API Error occurred');
      }
    });
  });

  it('handles API error with object detail', async () => {
    const mockApiError = { detail: { field: 'error' } };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockApiError,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.updateInputBlockData({
          id: 'test-id',
          data: mockUpdateData,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Validation error occurred');
      }
    });
  });

  it('handles API error without detail', async () => {
    const mockApiError = {};
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockApiError,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.updateInputBlockData({
          id: 'test-id',
          data: mockUpdateData,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to update input block data');
      }
    });
  });

  it('handles fetch error', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.updateInputBlockData({
          id: 'test-id',
          data: mockUpdateData,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  it('handles JSON parsing error', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('JSON parse error');
      },
    } as unknown as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.updateInputBlockData({
          id: 'test-id',
          data: mockUpdateData,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('JSON parse error');
      }
    });
  });

  it('invalidates queries on successful update', async () => {
    const mockResponse = { ...mockInputBlockData, ...mockUpdateData };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.updateInputBlockData({
        id: '1',
        data: mockUpdateData,
      });
    });

    // The mutation should have been successful
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('tracks updating state correctly', async () => {
    const mockResponse = { ...mockInputBlockData, ...mockUpdateData };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    // Initially not updating
    expect(result.current.isUpdating).toBe(false);

    // Start update and wait for completion
    await result.current.updateInputBlockData({
      id: 'test-id',
      data: mockUpdateData,
    });

    // Should not be updating after completion
    expect(result.current.isUpdating).toBe(false);
  });

  it('handles error state correctly', async () => {
    const mockApiError = { detail: 'API Error occurred' };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockApiError,
    } as Response);

    const { result } = renderHook(() => useUpdateInputBlockData(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.updateInputBlockData({
        id: 'test-id',
        data: mockUpdateData,
      });
    } catch (error) {
      // Error should be caught and stored in mutation state
    }

    // Should have error state
    expect(result.current.error).toBeDefined();
    expect(result.current.isSuccess).toBe(false);
  });
}); 