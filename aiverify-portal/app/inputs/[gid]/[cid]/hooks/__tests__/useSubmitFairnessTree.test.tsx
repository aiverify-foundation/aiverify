import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmitFairnessTree } from '../useSubmitFairnessTree';

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

const mockFairnessTreeData = {
  cid: 'test-cid',
  data: {
    sensitiveFeature: 'age',
    favourableOutcomeName: 'approved',
    qualified: 'yes',
    unqualified: 'no',
    selectedOutcomes: ['outcome1', 'outcome2'],
    metrics: ['metric1', 'metric2'],
    selections: { nodes: ['node1'], edges: ['edge1'] },
  },
  gid: 'test-gid',
  name: 'Test Fairness Tree',
  group: 'test-group',
};

describe('useSubmitFairnessTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit fairness tree successfully', async () => {
    const mockResponse = { success: true, message: 'Tree submitted successfully' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle successful submission with complex data', async () => {
    const complexData = {
      ...mockFairnessTreeData,
      data: {
        ...mockFairnessTreeData.data,
        'custom-field-1': 'custom-value-1',
        'custom-field-2': ['value1', 'value2'],
        'nested-object': {
          key1: 'value1',
          key2: 'value2',
        },
      },
    };

    const mockResponse = { success: true, message: 'Tree submitted successfully' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(complexData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complexData),
      });
    });
  });

  it('should handle 400 bad request errors', async () => {
    const apiError = {
      message: 'Validation error',
      status_code: 400,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => apiError,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle 404 not found errors', async () => {
    const apiError = {
      message: 'Not found',
      status_code: 404,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => apiError,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle 500 server errors', async () => {
    const apiError = {
      message: 'Internal server error',
      status_code: 500,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => apiError,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle 403 forbidden errors', async () => {
    const apiError = {
      message: 'Access denied',
      status_code: 403,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => apiError,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle 401 unauthorized errors', async () => {
    const apiError = {
      message: 'Authentication required',
      status_code: 401,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => apiError,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle response without message property', async () => {
    const mockResponse = { success: true };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle empty response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => '',
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle null response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => null,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle undefined response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => undefined,
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockFairnessTreeData),
      });
    });
  });

  it('should handle mutation state correctly', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    resolvePromise!({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('should handle mutation error state correctly', async () => {
    let rejectPromise: (error: Error) => void;
    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });

    mockFetch.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(mockFairnessTreeData);

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    rejectPromise!(new Error('Network error'));

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('should handle multiple concurrent submissions', async () => {
    const mockResponse1 = { success: true, message: 'Tree 1 submitted' };
    const mockResponse2 = { success: true, message: 'Tree 2 submitted' };

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

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    const data1 = { ...mockFairnessTreeData, name: 'Tree 1' };
    const data2 = { ...mockFairnessTreeData, name: 'Tree 2' };

    // Start two concurrent submissions
    const promise1 = result.current.submitFairnessTree(data1);
    const promise2 = result.current.submitFairnessTree(data2);

    await Promise.all([promise1, promise2]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/input_block_data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data1),
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/input_block_data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data2),
    });
  });

  it('should handle fairness tree data with empty strings', async () => {
    const emptyData = {
      cid: '',
      data: {},
      gid: '',
      name: '',
      group: '',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(emptyData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyData),
      });
    });
  });

  it('should handle fairness tree data with null values', async () => {
    const nullData = {
      cid: null as any,
      data: null as any,
      gid: null as any,
      name: null as any,
      group: null as any,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(nullData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nullData),
      });
    });
  });

  it('should handle fairness tree data with undefined values', async () => {
    const undefinedData = {} as any;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(undefinedData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(undefinedData),
      });
    });
  });

  it('should handle fairness tree data with special characters', async () => {
    const specialData = {
      cid: 'test-cid@#$%',
      data: { 'special-field': 'value@#$%' },
      gid: 'test-gid!@#',
      name: 'Test Tree @#$%',
      group: 'test-group!@#',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(specialData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(specialData),
      });
    });
  });

  it('should handle fairness tree data with very long values', async () => {
    const longString = 'a'.repeat(1000);
    const longData = {
      cid: longString,
      data: { longField: longString },
      gid: longString,
      name: longString,
      group: longString,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(longData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(longData),
      });
    });
  });

  it('should handle fairness tree data with nested objects', async () => {
    const nestedData = {
      cid: 'test-cid',
      data: {
        level1: {
          level2: {
            level3: {
              value: 'deeply nested value',
            },
          },
        },
        array: [1, 2, 3, { nested: 'object' }],
      },
      gid: 'test-gid',
      name: 'Nested Tree',
      group: 'test-group',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(nestedData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nestedData),
      });
    });
  });

  it('should handle fairness tree data with boolean values', async () => {
    const booleanData = {
      cid: 'test-cid',
      data: {
        isActive: true,
        isEnabled: false,
        settings: {
          autoSave: true,
          notifications: false,
        },
      },
      gid: 'test-gid',
      name: 'Boolean Tree',
      group: 'test-group',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(booleanData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booleanData),
      });
    });
  });

  it('should handle fairness tree data with number values', async () => {
    const numberData = {
      cid: 'test-cid',
      data: {
        count: 42,
        percentage: 75.5,
        settings: {
          timeout: 5000,
          retries: 3,
        },
      },
      gid: 'test-gid',
      name: 'Number Tree',
      group: 'test-group',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useSubmitFairnessTree(), {
      wrapper: createWrapper(),
    });

    result.current.submitFairnessTree(numberData);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(numberData),
      });
    });
  });
}); 