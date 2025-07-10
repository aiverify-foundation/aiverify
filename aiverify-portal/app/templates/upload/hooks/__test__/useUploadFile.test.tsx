import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { uploadJsonFile } from '../../components/utils/uploadJsonFile';
import { useUploadFiles } from '../useUploadFile';

// Mock the uploadJsonFile function
jest.mock('../../components/utils/uploadJsonFile', () => ({
  uploadJsonFile: jest.fn(),
}));

const mockUploadJsonFile = uploadJsonFile as jest.MockedFunction<typeof uploadJsonFile>;

// Create a test wrapper for React Query
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUploadFiles', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const mockFileUpload = {
    file: new File(['test content'], 'test.json', { type: 'application/json' }),
    progress: 0,
    status: 'idle' as const,
    id: 'test-id',
  };

  const mockPayload = {
    fileUpload: mockFileUpload,
    onProgress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return mutation object', () => {
    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should call uploadJsonFile when mutate is called', async () => {
    mockUploadJsonFile.mockResolvedValue({ message: 'Upload successful' });

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    result.current.mutate(mockPayload);

    await waitFor(() => {
      expect(mockUploadJsonFile).toHaveBeenCalledWith(mockPayload);
    });
  });

  it('should call onSuccess when upload succeeds', async () => {
    const successMessage = 'Upload successful';
    mockUploadJsonFile.mockResolvedValue({ message: successMessage });

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    result.current.mutate(mockPayload);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(successMessage);
    });
  });

  it('should call onError when upload fails', async () => {
    const error = new Error('Upload failed');
    mockUploadJsonFile.mockRejectedValue(error);

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    result.current.mutate(mockPayload);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });

  it('should handle mutateAsync', async () => {
    const successMessage = 'Upload successful';
    mockUploadJsonFile.mockResolvedValue({ message: successMessage });

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    const response = await result.current.mutateAsync(mockPayload);

    expect(response).toEqual({ message: successMessage });
    expect(mockUploadJsonFile).toHaveBeenCalledWith(mockPayload);
  });

  it('should update loading states correctly', async () => {
    const successMessage = 'Upload successful';
    mockUploadJsonFile.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ message: successMessage }), 100)
      )
    );

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);

    result.current.mutate(mockPayload);

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should handle error states correctly', async () => {
    const error = new Error('Network error');
    mockUploadJsonFile.mockRejectedValue(error);

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    result.current.mutate(mockPayload);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });

  it('should reset state between mutations', async () => {
    mockUploadJsonFile.mockResolvedValue({ message: 'Success' });

    const { result } = renderHook(
      () => useUploadFiles({
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    // First mutation
    result.current.mutate(mockPayload);
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Reset
    result.current.reset();
    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('Hook parameters', () => {
    it('should work with different onSuccess functions', async () => {
      const customOnSuccess = jest.fn();
      mockUploadJsonFile.mockResolvedValue({ message: 'Custom success' });

      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: customOnSuccess,
          onError: mockOnError,
        }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(customOnSuccess).toHaveBeenCalledWith('Custom success');
      });
    });

    it('should work with different onError functions', async () => {
      const customOnError = jest.fn();
      const error = new Error('Custom error');
      mockUploadJsonFile.mockRejectedValue(error);

      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: customOnError,
        }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(customOnError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Multiple file uploads', () => {
    it('should handle multiple consecutive uploads', async () => {
      mockUploadJsonFile.mockResolvedValue({ message: 'Success' });

      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper: createWrapper() }
      );

      // First upload
      result.current.mutate(mockPayload);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second upload
      const secondPayload = {
        ...mockPayload,
        fileUpload: {
          ...mockFileUpload,
          id: 'second-id',
        },
      };

      result.current.mutate(secondPayload);
      await waitFor(() => {
        expect(mockUploadJsonFile).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Progress tracking', () => {
    it('should handle progress callbacks', async () => {
      const progressCallback = jest.fn();
      mockUploadJsonFile.mockResolvedValue({ message: 'Success' });

      const payloadWithProgress = {
        ...mockPayload,
        onProgress: progressCallback,
      };

      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(payloadWithProgress);

      await waitFor(() => {
        expect(mockUploadJsonFile).toHaveBeenCalledWith(payloadWithProgress);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty file uploads', async () => {
      const emptyFile = new File([], 'empty.json', { type: 'application/json' });
      const emptyPayload = {
        fileUpload: {
          ...mockFileUpload,
          file: emptyFile,
        },
        onProgress: jest.fn(),
      };

      mockUploadJsonFile.mockResolvedValue({ message: 'Empty file uploaded' });

      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(emptyPayload);

      await waitFor(() => {
        expect(mockUploadJsonFile).toHaveBeenCalledWith(emptyPayload);
      });
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      mockUploadJsonFile.mockRejectedValue(timeoutError);

      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(timeoutError);
      });
    });
  });
}); 