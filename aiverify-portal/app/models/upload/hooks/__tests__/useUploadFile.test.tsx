import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useUploadFile from '../useUploadFile';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

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

describe('useUploadFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('successfully uploads file and returns response', async () => {
    const mockResponse = { success: true, message: 'File uploaded successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('files', new File(['test content'], 'test.zip'));
    formData.append('model_types', 'classification');

    // Execute the mutation
    const response = await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/upload', {
      method: 'POST',
      body: formData,
    });
    expect(response).toEqual(mockResponse);
  });

  it('logs FormData entries during upload', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('files', new File(['test content'], 'test.zip'));
    formData.append('model_types', 'classification');

    await result.current.mutateAsync(formData);

    // Check that FormData entries were logged
    expect(console.log).toHaveBeenCalledWith('hook paired: ', 'files', expect.any(File));
    expect(console.log).toHaveBeenCalledWith('hook paired: ', 'model_types', 'classification');
  });

  it('throws error when upload fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    });

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('files', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Failed to upload file');
  });

  it('handles network errors', async () => {
    const networkError = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('files', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Network error');
  });

  it('logs multiple files in FormData', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('files', new File(['content1'], 'file1.zip'));
    formData.append('files', new File(['content2'], 'file2.zip'));
    formData.append('model_types', 'classification,regression');

    await result.current.mutateAsync(formData);

    // Check that all FormData entries were logged
    expect(console.log).toHaveBeenCalledWith('hook paired: ', 'files', expect.any(File));
    expect(console.log).toHaveBeenCalledWith('hook paired: ', 'model_types', 'classification,regression');
  });

  it('handles empty FormData', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();

    await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/upload', {
      method: 'POST',
      body: formData,
    });
  });

  it('provides mutation state information', () => {
    const { result } = renderHook(() => useUploadFile(), {
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

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('files', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Invalid JSON');
  });
}); 