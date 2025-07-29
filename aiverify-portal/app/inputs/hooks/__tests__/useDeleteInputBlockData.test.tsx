import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteInputBlockData } from '../useDeleteInputBlockData';

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

describe('useDeleteInputBlockData', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mutation object', () => {
    const { result } = renderHook(() => useDeleteInputBlockData(mockOnSuccess, mockOnError), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.error).toBe('object');
  });

  it('successfully deletes input block data', async () => {
    const mockResponse = { success: true };
    const mockProcessResponse = require('@/lib/utils/http-requests').processResponse;
    const mockIsApiError = require('@/lib/utils/error-utils').isApiError;
    
    mockProcessResponse.mockResolvedValue(mockResponse);
    mockIsApiError.mockReturnValue(false);

    const { result } = renderHook(() => useDeleteInputBlockData(mockOnSuccess, mockOnError), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate(123);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/input_block_data/123', {
      method: 'DELETE',
    });
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse, 123, undefined);
  });

  it('handles API error', async () => {
    const mockApiError = { data: 'API Error' };
    const mockProcessResponse = require('@/lib/utils/http-requests').processResponse;
    const mockIsApiError = require('@/lib/utils/error-utils').isApiError;
    const mockParseFastAPIError = require('@/lib/utils/parseFastAPIError').parseFastAPIError;
    
    mockProcessResponse.mockResolvedValue(mockApiError);
    mockIsApiError.mockReturnValue(true);
    mockParseFastAPIError.mockReturnValue(new Error('Parsed API Error'));

    const { result } = renderHook(() => useDeleteInputBlockData(mockOnSuccess, mockOnError), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate(123);
    });

    expect(mockParseFastAPIError).toHaveBeenCalledWith(mockApiError.data);
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error), 123, undefined);
  });

  it('handles message error', async () => {
    const mockMessageError = { message: 'Error message' };
    const mockProcessResponse = require('@/lib/utils/http-requests').processResponse;
    const mockIsApiError = require('@/lib/utils/error-utils').isApiError;
    const mockToErrorWithMessage = require('@/lib/utils/error-utils').toErrorWithMessage;
    
    mockProcessResponse.mockResolvedValue(mockMessageError);
    mockIsApiError.mockReturnValue(false);
    mockToErrorWithMessage.mockReturnValue(new Error('Converted Error'));

    const { result } = renderHook(() => useDeleteInputBlockData(mockOnSuccess, mockOnError), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate(123);
    });

    expect(mockToErrorWithMessage).toHaveBeenCalledWith(mockMessageError);
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error), 123, undefined);
  });

  it('handles fetch error', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDeleteInputBlockData(mockOnSuccess, mockOnError), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate(123);
    });

    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error), 123, undefined);
  });
}); 