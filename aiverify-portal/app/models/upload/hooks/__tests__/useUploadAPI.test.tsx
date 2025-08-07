import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useUploadAPI from '../useUploadAPI';

// Mock fetch globally
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUploadAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('successfully uploads API model and returns response', async () => {
    const mockResponse = { success: true, message: 'API model uploaded successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));
    formData.append('model_name', 'Test API Model');

    // Execute the mutation
    const response = await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/modelapi', {
      method: 'POST',
      body: formData,
    });
    expect(response).toEqual(mockResponse);
  });

  it('throws error when upload fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    });

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Failed to upload Model API');
  });

  it('handles network errors', async () => {
    const networkError = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Network error');
  });

  it('handles empty FormData', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();

    await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/modelapi', {
      method: 'POST',
      body: formData,
    });
  });

  it('provides mutation state information', async () => {
    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
  });

  it('handles JSON parsing errors in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Invalid JSON');
  });

  it('handles different HTTP error status codes', async () => {
    const testCases = [
      { status: 400, statusText: 'Bad Request' },
      { status: 401, statusText: 'Unauthorized' },
      { status: 403, statusText: 'Forbidden' },
      { status: 404, statusText: 'Not Found' },
      { status: 500, statusText: 'Internal Server Error' },
    ];

    for (const testCase of testCases) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: testCase.status,
        statusText: testCase.statusText,
      });

      const { result } = renderHook(() => useUploadAPI(), {
        wrapper: createWrapper(),
      });

      const formData = new FormData();
      formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));

      await expect(result.current.mutateAsync(formData)).rejects.toThrow('Failed to upload Model API');
    }
  });

  it('handles complex FormData with multiple fields', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));
    formData.append('model_name', 'Test Model');
    formData.append('description', 'A test API model');
    formData.append('auth_token', 'secret-token');

    await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/modelapi', {
      method: 'POST',
      body: formData,
    });
  });

  it('handles timeout scenarios', async () => {
    // Mock a timeout by making fetch hang
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    const { result } = renderHook(() => useUploadAPI(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));

    await act(async () => {
      await expect(result.current.mutateAsync(formData)).rejects.toThrow('Request timeout');
    });
  });

  it('handles successful response with different data structures', async () => {
    const testResponses = [
      { success: true, id: 'model-123' },
      { status: 'created', model_id: 'api-model-456' },
      { result: 'success', data: { id: 'model-789', name: 'Test Model' } },
    ];

    for (const mockResponse of testResponses) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUploadAPI(), {
        wrapper: createWrapper(),
      });

      const formData = new FormData();
      formData.append('api_config', new File(['{"url": "https://api.example.com"}'], 'config.json'));

      const response = await result.current.mutateAsync(formData);
      expect(response).toEqual(mockResponse);
    }
  });
}); 