import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteFairnessTree } from '../useDeleteFairnessTree';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper component for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useDeleteFairnessTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete fairness tree successfully', async () => {
    const mockResponse = { success: true, message: 'Tree deleted successfully' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(123);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/123', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: mockResponse }, 123, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle successful deletion with empty response', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(456);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/456', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 204, data: null }, 456, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle API error responses', async () => {
    const apiError = {
      detail: 'Tree not found',
      status_code: 404,
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => apiError,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    try {
      await result.current.mutateAsync(789);
    } catch (error) {
      // Expected to throw
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/789', {
      method: 'DELETE',
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    try {
      await result.current.mutateAsync(101);
    } catch (error) {
      // Expected to throw
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/101', {
      method: 'DELETE',
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(networkError, 101, undefined);
  });

  it('should handle JSON parsing errors', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    try {
      await result.current.mutateAsync(202);
    } catch (error) {
      // Expected to throw
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/202', {
      method: 'DELETE',
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle 500 server errors', async () => {
    const serverError = {
      detail: 'Internal server error',
      status_code: 500,
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => serverError,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    try {
      await result.current.mutateAsync(303);
    } catch (error) {
      // Expected to throw
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/303', {
      method: 'DELETE',
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle 403 forbidden errors', async () => {
    const forbiddenError = {
      detail: 'Access denied',
      status_code: 403,
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => forbiddenError,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    try {
      await result.current.mutateAsync(404);
    } catch (error) {
      // Expected to throw
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/404', {
      method: 'DELETE',
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle 401 unauthorized errors', async () => {
    const unauthorizedError = {
      detail: 'Authentication required',
      status_code: 401,
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => unauthorizedError,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    try {
      await result.current.mutateAsync(505);
    } catch (error) {
      // Expected to throw
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/505', {
      method: 'DELETE',
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle response with message property', async () => {
    const messageResponse = { message: 'Custom error message' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => messageResponse,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(606);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/606', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: messageResponse }, 606, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle zero tree ID', async () => {
    const mockResponse = { success: true, message: 'Tree deleted successfully' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(0);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/0', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: mockResponse }, 0, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle negative tree ID', async () => {
    const mockResponse = { success: true, message: 'Tree deleted successfully' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(-1);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/-1', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: mockResponse }, -1, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle very large tree ID', async () => {
    const largeId = Number.MAX_SAFE_INTEGER;
    const mockResponse = { success: true, message: 'Tree deleted successfully' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(largeId);

    expect(mockFetch).toHaveBeenCalledWith(`/api/input_block_data/${largeId}`, {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: mockResponse }, largeId, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle mutation state correctly', async () => {
    const mockResponse = { success: true, message: 'Tree deleted successfully' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise as any);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    // Start mutation
    let mutationPromise: any;
    await act(async () => {
      mutationPromise = result.current.mutateAsync(707);
    });

    // Wait for the mutation to start
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isPending).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await mutationPromise;

      // Wait for the mutation state to update
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isPending).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: mockResponse }, 707, undefined);
  });

  it('should handle mutation error state correctly', async () => {
    const networkError = new Error('Network error');
    const onSuccess = jest.fn();
    const onError = jest.fn();

    let rejectPromise: (error: Error) => void;
    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });

    mockFetch.mockReturnValueOnce(promise as any);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    // Start mutation
    let mutationPromise: any;
    await act(async () => {
      mutationPromise = result.current.mutateAsync(808);
    });

    // Wait for the mutation to start
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isPending).toBe(true);

    // Reject the promise
    await act(async () => {
      rejectPromise!(networkError);

      try {
        await mutationPromise;
      } catch (error) {
        // Expected to throw
      }

      // Wait for the mutation state to update
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isPending).toBe(false);
    expect(onError).toHaveBeenCalledWith(networkError, 808, undefined);
  });

  it('should handle multiple concurrent deletions', async () => {
    const mockResponse1 = { success: true, message: 'Tree 1 deleted' };
    const mockResponse2 = { success: true, message: 'Tree 2 deleted' };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse1,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse2,
      } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    // Start two concurrent deletions
    const promise1 = result.current.mutateAsync(909);
    const promise2 = result.current.mutateAsync(1010);

    await Promise.all([promise1, promise2]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/input_block_data/909', {
      method: 'DELETE',
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/input_block_data/1010', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle empty response body', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => '',
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(1111);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1111', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: '' }, 1111, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle response with undefined body', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => undefined,
    } as Response);

    const { result } = renderHook(
      () => useDeleteFairnessTree(onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync(1212);

    expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1212', {
      method: 'DELETE',
    });
    expect(onSuccess).toHaveBeenCalledWith({ status: 200, data: undefined }, 1212, undefined);
    expect(onError).not.toHaveBeenCalled();
  });
}); 