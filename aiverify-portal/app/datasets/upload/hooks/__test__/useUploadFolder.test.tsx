import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useUploadFolder from '../useUploadFolder';

// Mock fetch
global.fetch = jest.fn();

describe('useUploadFolder', () => {
  const mockFormData = new FormData();
  mockFormData.append('folder', new File(['content'], 'test.csv', { type: 'text/csv' }));

  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useUploadFolder Hook', () => {
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

    it('returns mutation object with correct structure', () => {
      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('error');
    });

    it('sends request to correct endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test_datasets/upload_folder', {
        method: 'POST',
        body: mockFormData,
      });
    });

    it('handles successful upload', async () => {
      const mockResponse = { success: true, message: 'Upload successful' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('handles HTTP error responses', async () => {
      const errorResponse = { detail: 'Bad request', status_code: 400 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to upload dataset folder: Bad Request');
    });

    it('handles network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(result.current.mutateAsync(mockFormData)).rejects.toThrow('Network error');
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('handles JSON parsing errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('Failed to upload dataset folder');
    });

    it('handles unknown errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('An unknown error occurred while uploading the dataset folder');
    });

    it('handles empty FormData', async () => {
      const emptyFormData = new FormData();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(emptyFormData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test_datasets/upload_folder', {
        method: 'POST',
        body: emptyFormData,
      });
    });

    it('handles large FormData', async () => {
      const largeFormData = new FormData();
      const largeFile = new File(['x'.repeat(1000000)], 'large.csv', { type: 'text/csv' });
      largeFormData.append('folder', largeFile);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(largeFormData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test_datasets/upload_folder', {
        method: 'POST',
        body: largeFormData,
      });
    });

    it('handles multiple files in FormData', async () => {
      const multiFileFormData = new FormData();
      const file1 = new File(['content1'], 'file1.csv', { type: 'text/csv' });
      const file2 = new File(['content2'], 'file2.csv', { type: 'text/csv' });
      multiFileFormData.append('folder', file1);
      multiFileFormData.append('folder', file2);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(multiFileFormData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test_datasets/upload_folder', {
        method: 'POST',
        body: multiFileFormData,
      });
    });

    it('handles files with special characters in names', async () => {
      const specialFormData = new FormData();
      const specialFile = new File(['content'], 'test@#$%^&*().csv', { type: 'text/csv' });
      specialFormData.append('folder', specialFile);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(specialFormData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test_datasets/upload_folder', {
        method: 'POST',
        body: specialFormData,
      });
    });

    it('handles different HTTP status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500];
      
      for (const statusCode of statusCodes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: statusCode,
          statusText: `Status ${statusCode}`,
          json: async () => ({ detail: `Error ${statusCode}` }),
        });

        const { result } = renderHook(() => useUploadFolder(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.mutate(mockFormData);
        });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(`Failed to upload dataset folder: Status ${statusCode}`);
      }
    });

    it('handles timeout scenarios', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Request timeout');
    });

    it('handles aborted requests', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Request aborted');
    });

    it('handles malformed response data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null, // Malformed response
      });

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockFormData);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('handles response without JSON content', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: undefined, // response.json is not a function
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useUploadFolder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(result.current.mutateAsync(mockFormData)).rejects.toThrow('Failed to upload dataset folder: Internal Server Error');
      });

      // Wait for the mutation to complete and check the error state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to upload dataset folder: Internal Server Error');
    });
  });
}); 