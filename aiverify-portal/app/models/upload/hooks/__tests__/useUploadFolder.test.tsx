import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useUploadFolder from '../useUploadFolder';

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

describe('useUploadFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('successfully uploads folder and returns response', async () => {
    const mockResponse = { success: true, message: 'Folder uploaded successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    // Execute the mutation
    const response = await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/upload_folder', {
      method: 'POST',
      body: formData,
    });
    expect(response).toEqual(mockResponse);
  });

  it('throws error with status text when upload fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Failed to upload folder: Bad Request');
  });

  it('extracts detailed error message from response when available', async () => {
    const errorResponse = { detail: 'Invalid folder structure' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => errorResponse,
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Invalid folder structure');
  });

  it('logs error data when available', async () => {
    const errorResponse = { detail: 'Invalid folder structure' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => errorResponse,
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    try {
      await result.current.mutateAsync(formData);
    } catch (error) {
      // Expected to throw
    }

    expect(console.log).toHaveBeenCalledWith('Error data:', errorResponse);
  });

  it('falls back to status text when JSON parsing fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Failed to upload folder: Internal Server Error');
  });

  it('logs JSON parsing errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    try {
      await result.current.mutateAsync(formData);
    } catch (error) {
      // Expected to throw
    }

    expect(console.log).toHaveBeenCalledWith('Failed to parse error response:', expect.any(Error));
  });

  it('handles network errors', async () => {
    const networkError = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Network error');
  });

  it('handles empty FormData', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();

    await result.current.mutateAsync(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_models/upload_folder', {
      method: 'POST',
      body: formData,
    });
  });

  it('provides mutation state information', () => {
    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
  });

  it('handles JSON parsing errors in successful response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useUploadFolder(), {
      wrapper: createWrapper(),
    });

    const formData = new FormData();
    formData.append('folder', new File(['test content'], 'test.zip'));

    await expect(result.current.mutateAsync(formData)).rejects.toThrow('Invalid JSON');
  });

  it('handles multiple error scenarios with different status codes', async () => {
    const testCases = [
      { status: 400, statusText: 'Bad Request', detail: 'Invalid folder format' },
      { status: 413, statusText: 'Payload Too Large', detail: 'Folder size exceeds limit' },
      { status: 500, statusText: 'Internal Server Error', detail: 'Server processing error' },
    ];

    for (const testCase of testCases) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: testCase.status,
        statusText: testCase.statusText,
        json: async () => ({ detail: testCase.detail }),
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      const formData = new FormData();
      formData.append('folder', new File(['test content'], 'test.zip'));

      await expect(result.current.mutateAsync(formData)).rejects.toThrow(testCase.detail);
    }
  });
}); 