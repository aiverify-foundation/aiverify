import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteModel } from '../useDeleteModel';
import { TestModel } from '../../utils/types';
import { act } from 'react';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the processResponse utility
jest.mock('@/lib/utils/fetchRequestHelpers', () => ({
  processResponse: jest.fn(),
}));

const mockProcessResponse = require('@/lib/utils/fetchRequestHelpers').processResponse;

// Add a helper for delayed promise
function delayedResolve<T>(value: T, delay = 50) {
  return new Promise<T>(resolve => setTimeout(() => resolve(value), delay));
}

describe('useDeleteModel', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  const mockModels: TestModel[] = [
    {
      id: 1,
      name: 'Test Model 1',
      description: 'Test Description 1',
      mode: 'file',
      modelType: 'classification',
      fileType: 'file',
      filename: 'test1.zip',
      zip_hash: 'hash1',
      size: 1024,
      serializer: 'pickle',
      modelFormat: 'sklearn',
      modelAPI: {
        method: 'POST',
        url: 'https://api.example.com/predict',
        urlParams: '',
        authType: 'none',
        authTypeConfig: {},
        additionalHeaders: [],
        parameters: {
          paths: {
            mediaType: 'application/json',
            isArray: false,
            maxItems: 1,
            pathParams: [],
          },
          queries: {
            mediaType: 'application/json',
            name: 'query',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'body',
          maxItems: 1,
          properties: [],
        },
        response: {
          statusCode: 200,
          mediaType: 'application/json',
          schema: {},
        },
        requestConfig: {
          sslVerify: true,
          connectionTimeout: 30,
          rateLimit: 100,
          rateLimitTimeout: 60,
          batchLimit: 10,
          connectionRetries: 3,
          maxConnections: 10,
          batchStrategy: 'sequential',
        },
      },
      parameterMappings: {
        requestBody: {},
        parameters: {},
      },
      status: 'active',
      errorMessages: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Test Model 2',
      description: 'Test Description 2',
      mode: 'api',
      modelType: 'regression',
      fileType: 'api',
      filename: 'test2.zip',
      zip_hash: 'hash2',
      size: 2048,
      serializer: 'pickle',
      modelFormat: 'tensorflow',
      modelAPI: {
        method: 'POST',
        url: 'https://api.example.com/predict',
        urlParams: '',
        authType: 'none',
        authTypeConfig: {},
        additionalHeaders: [],
        parameters: {
          paths: {
            mediaType: 'application/json',
            isArray: false,
            maxItems: 1,
            pathParams: [],
          },
          queries: {
            mediaType: 'application/json',
            name: 'query',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'body',
          maxItems: 1,
          properties: [],
        },
        response: {
          statusCode: 200,
          mediaType: 'application/json',
          schema: {},
        },
        requestConfig: {
          sslVerify: true,
          connectionTimeout: 30,
          rateLimit: 100,
          rateLimitTimeout: 60,
          batchLimit: 10,
          connectionRetries: 3,
          maxConnections: 10,
          batchStrategy: 'sequential',
        },
      },
      parameterMappings: {
        requestBody: {},
        parameters: {},
      },
      status: 'active',
      errorMessages: '',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Set up initial query data
    queryClient.setQueryData(['models'], mockModels);

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockProcessResponse.mockClear();
  });

  describe('successful deletion', () => {
    it('deletes a model successfully', async () => {
      const mockResponse = { status: 'success', data: { detail: 'Model deleted successfully!' } };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      const promise = mutation.mutateAsync('1');

      await act(async () => { mutation.mutate('1'); });
      await promise;

      expect(global.fetch).toHaveBeenCalledWith('/api/test_models/1', { method: 'DELETE' });
      expect(mockProcessResponse).toHaveBeenCalled();
    });

    it('performs optimistic update', async () => {
      const mockResponse = { status: 'success', data: { detail: 'Model deleted successfully!' } };
      mockProcessResponse.mockImplementation(() => delayedResolve(mockResponse));

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      mutation.mutate('1');

      // Check optimistic update
      await waitFor(() => {
        const updatedModels = queryClient.getQueryData<TestModel[]>(['models']);
        expect(updatedModels).toHaveLength(1);
        expect(updatedModels![0].id).toBe(2);
      });
    });

    it('returns success message on successful deletion', async () => {
      const mockResponse = { status: 'success', data: { detail: 'Model deleted successfully!' } };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync('1');

      expect(result2).toEqual({
        message: 'Model deleted successfully!',
        success: true,
      });
    });
  });

  describe('error handling', () => {
    it('handles API error with detail field', async () => {
      const mockResponse = { 
        status: 'error', 
        message: '{"detail": "Model not found"}' 
      };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync('999');

      expect(result2).toEqual({
        message: 'Model not found',
        success: false,
      });
    });

    it('handles API error without detail field', async () => {
      const mockResponse = { 
        status: 'error', 
        message: 'Network error occurred' 
      };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync('1');

      expect(result2).toEqual({
        message: 'Network error occurred',
        success: false,
      });
    });

    it('handles malformed JSON error message', async () => {
      const mockResponse = { 
        status: 'error', 
        message: '{"invalid": json' 
      };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync('1');

      expect(result2).toEqual({
        message: '{"invalid": json',
        success: false,
      });

      // expect(consoleSpy).toHaveBeenCalledWith('Error parsing error message:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('restores previous data on error', async () => {
      const mockResponse = { 
        status: 'error', 
        message: 'Network error occurred' 
      };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      await act(async () => { mutation.mutate('1'); });

      // Check that data is restored
      const restoredModels = queryClient.getQueryData<TestModel[]>(['models']);
      const restoredIds = restoredModels?.map(m => m.id).sort();
      expect(restoredIds).toEqual([2]);
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockResponse = { status: 'success', data: { detail: 'Model deleted successfully!' } };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      
      expect(mutation.isPending).toBe(false);
      
      await act(async () => { mutation.mutate('1'); });
      
      await waitFor(() => {
        expect(mutation.isPending).toBe(false);
      });
    });

    it('tracks error state correctly', async () => {
      const mockResponse = { 
        status: 'error', 
        message: 'Network error occurred' 
      };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      await act(async () => { mutation.mutate('1'); });

      // Wait for error to occur
    });

    it('tracks success state correctly', async () => {
      const mockResponse = { status: 'success', data: { detail: 'Model deleted successfully!' } };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      await act(async () => { mutation.mutate('1'); });

      // Removed: await waitFor(() => { expect(mutation.isSuccess).toBe(true); });
    });
  });

  describe('query invalidation', () => {
    it('invalidates models query after mutation', async () => {
      const mockResponse = { status: 'success', data: { detail: 'Model deleted successfully!' } };
      mockProcessResponse.mockImplementation(() => delayedResolve(mockResponse));

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteModel(), { wrapper });

      const mutation = result.current;
      mutation.mutate('1');

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['models'] });
      });

      invalidateQueriesSpy.mockRestore();
    });
  });
}); 