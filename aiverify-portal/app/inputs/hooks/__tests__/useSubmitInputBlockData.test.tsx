import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmitInputBlockData } from '../useSubmitInputBlockData';

// Mock fetch
global.fetch = jest.fn();

// Mock the utility functions
jest.mock('@/lib/utils/error-utils', () => ({
  isApiError: jest.fn(),
  toErrorWithMessage: jest.fn(),
}));

jest.mock('@/lib/utils/http-requests', () => ({
  processResponse: jest.fn(),
}));

jest.mock('@/lib/utils/parseFastAPIError', () => ({
  parseFastAPIError: jest.fn(),
}));

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

describe('useSubmitInputBlockData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mutation object', () => {
    const { result } = renderHook(() => useSubmitInputBlockData(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.submitInputBlockData).toBe('function');
    expect(typeof result.current.isSubmitting).toBe('boolean');
    expect(typeof result.current.error).toBe('object');
  });

  it('successfully submits input block data', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const mockData = { gid: 'test-gid', cid: 'test-cid', name: 'test', group: 'test-group', data: {} };

    const { result } = renderHook(() => useSubmitInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.submitInputBlockData(mockData);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/input_block_data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData),
    });
  });

  it('handles API error', async () => {
    const mockApiError = { detail: 'API Error' };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockApiError,
    } as Response);

    const mockData = { gid: 'test-gid', cid: 'test-cid', name: 'test', group: 'test-group', data: {} };

    const { result } = renderHook(() => useSubmitInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.submitInputBlockData(mockData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('API Error');
      }
    });
  });

  it('handles validation error', async () => {
    const mockValidationError = { detail: { field: 'error' } };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockValidationError,
    } as Response);

    const mockData = { gid: 'test-gid', cid: 'test-cid', name: 'test', group: 'test-group', data: {} };

    const { result } = renderHook(() => useSubmitInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.submitInputBlockData(mockData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Validation error occurred');
      }
    });
  });

  it('handles fetch error', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    const mockData = { gid: 'test-gid', cid: 'test-cid', name: 'test', group: 'test-group', data: {} };

    const { result } = renderHook(() => useSubmitInputBlockData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.submitInputBlockData(mockData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });
}); 