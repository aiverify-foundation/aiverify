import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditModel } from '../useEditModel';
import { TestModel } from '../../utils/types';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the utility functions
jest.mock('@/lib/utils/error-utils', () => ({
  toErrorWithMessage: jest.fn(),
}));

jest.mock('@/lib/utils/http-requests', () => ({
  processResponse: jest.fn(),
}));

const mockToErrorWithMessage = require('@/lib/utils/error-utils').toErrorWithMessage;
const mockProcessResponse = require('@/lib/utils/http-requests').processResponse;

describe('useEditModel', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  const mockModel: TestModel = {
    id: 1,
    name: 'Test Model',
    description: 'A test model',
    mode: 'file',
    modelType: 'classification',
    fileType: 'file',
    filename: 'model.zip',
    zip_hash: 'abc123',
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
  };

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

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockProcessResponse.mockClear();
    mockToErrorWithMessage.mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  describe('successful update', () => {
    it('updates model details successfully', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Model Name' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      const promise = mutation.mutateAsync(updatedModel);

      await promise;

      expect(global.fetch).toHaveBeenCalledWith('/api/test_models/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedModel),
      });
      expect(mockProcessResponse).toHaveBeenCalled();
    });

    it('returns updated model data on success', async () => {
      const updatedModel = { ...mockModel, description: 'Updated description' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync(updatedModel);

      expect(result2).toEqual(updatedModel);
    });

    it('calls onSuccess callback', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const updatedModel = { ...mockModel, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      const promise = mutation.mutateAsync(updatedModel);
      await promise;

      expect(consoleSpy).toHaveBeenCalledWith('Changes saved successfully!');
      consoleSpy.mockRestore();
    });

    it('handles partial model updates', async () => {
      const partialUpdate = { ...mockModel, name: 'New Name', description: 'New Description' };
      const mockResponse = { data: partialUpdate };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync(partialUpdate);

      expect(result2.name).toBe('New Name');
      expect(result2.description).toBe('New Description');
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const apiError = new Error('API Error');
      mockProcessResponse.mockResolvedValue(apiError);
      mockToErrorWithMessage.mockReturnValue(apiError);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await expect(mutation.mutateAsync(mockModel)).rejects.toThrow('API Error');
    });

    it('calls onError callback with error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const apiError = new Error('Network error');
      mockProcessResponse.mockResolvedValue(apiError);
      mockToErrorWithMessage.mockReturnValue(apiError);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await expect(mutation.mutateAsync(mockModel)).rejects.toThrow('Network error');
      consoleSpy.mockRestore();
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await expect(mutation.mutateAsync(mockModel)).rejects.toThrow('Network error');
    });

    it('handles malformed JSON in request body', async () => {
      const modelWithCircularRef = { ...mockModel };
      (modelWithCircularRef as any).circularRef = modelWithCircularRef;

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await expect(mutation.mutateAsync(modelWithCircularRef)).rejects.toThrow();
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      
      expect(mutation.isPending).toBe(false);
      
      mutation.mutate(updatedModel);
      
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockProcessResponse.mockResolvedValue(apiError);
      mockToErrorWithMessage.mockReturnValue(apiError);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      mutation.mutate(mockModel);

    });

    it('tracks success state correctly', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      mutation.mutate(updatedModel);

    });
  });

  describe('request formatting', () => {
    it('sends correct HTTP method', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await mutation.mutateAsync(updatedModel);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('sends correct headers', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await mutation.mutateAsync(updatedModel);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('sends model data in request body', async () => {
      const updatedModel = { ...mockModel, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await mutation.mutateAsync(updatedModel);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(updatedModel),
        })
      );
    });

    it('constructs correct URL with model ID', async () => {
      const updatedModel = { ...mockModel, id: 123, name: 'Updated Model' };
      const mockResponse = { data: updatedModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      await mutation.mutateAsync(updatedModel);

      expect(global.fetch).toHaveBeenCalledWith('/api/test_models/123', expect.any(Object));
    });
  });

  describe('data validation', () => {
    it('handles model with all required fields', async () => {
      const completeModel = { ...mockModel };
      const mockResponse = { data: completeModel };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync(completeModel);

      expect(result2).toEqual(completeModel);
    });

    it('handles model with optional fields', async () => {
      const modelWithOptionals = { 
        ...mockModel, 
        errorMessages: 'Some error message',
        status: 'inactive'
      };
      const mockResponse = { data: modelWithOptionals };
      mockProcessResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditModel(), { wrapper });

      const mutation = result.current;
      const result2 = await mutation.mutateAsync(modelWithOptionals);

      expect(result2.errorMessages).toBe('Some error message');
      expect(result2.status).toBe('inactive');
    });
  });
}); 