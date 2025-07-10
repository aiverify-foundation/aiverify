import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadFiles } from '../useUploadFile';
import React from 'react';

// Mock the uploadZipFile utility
jest.mock('@/app/plugins/upload/components/utils/uploadZipFile', () => ({
  uploadZipFile: jest.fn(),
  UploadRequestPayload: {},
}));

import { uploadZipFile } from '@/app/plugins/upload/components/utils/uploadZipFile';

const mockUploadZipFile = uploadZipFile as jest.MockedFunction<typeof uploadZipFile>;

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

describe('useUploadFiles Hook', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Successful upload', () => {
    it('calls onSuccess callback with message when upload succeeds', async () => {
      const successMessage = 'File uploaded successfully!';
      mockUploadZipFile.mockResolvedValueOnce({ message: successMessage });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'test.zip', { type: 'application/zip' }),
          progress: 0,
          status: 'idle' as const,
          id: 'test-id',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUploadZipFile).toHaveBeenCalledWith(mockPayload);
      expect(mockOnSuccess).toHaveBeenCalledWith(successMessage);
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('passes correct payload to uploadZipFile function', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'Success' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockFile = new File(['test content'], 'plugin.zip', { type: 'application/zip' });
      const mockOnProgress = jest.fn();
      
      const payload = {
        fileUpload: {
          file: mockFile,
          progress: 25,
          status: 'uploading' as const,
          id: 'upload-123',
        },
        onProgress: mockOnProgress,
      };

      result.current.mutate(payload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUploadZipFile).toHaveBeenCalledWith(payload);
      expect(mockUploadZipFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Failed upload', () => {
    it('calls onError callback when upload fails', async () => {
      const errorMessage = 'Upload failed due to network error';
      const error = new Error(errorMessage);
      mockUploadZipFile.mockRejectedValueOnce(error);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'test.zip', { type: 'application/zip' }),
          progress: 0,
          status: 'idle' as const,
          id: 'test-id',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockOnError).toHaveBeenCalledWith(error);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('handles various error types correctly', async () => {
      const customError = new Error('File too large');
      mockUploadZipFile.mockRejectedValueOnce(customError);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'large-file.zip', { type: 'application/zip' }),
          progress: 0,
          status: 'error' as const,
          id: 'error-upload',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(customError);
      expect(mockOnError).toHaveBeenCalledWith(customError);
    });
  });

  describe('Hook states', () => {
    it('starts in idle state', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('transitions through mutation states correctly', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'Success' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'test.zip', { type: 'application/zip' }),
          progress: 0,
          status: 'uploading' as const,
          id: 'test-upload',
        },
        onProgress: jest.fn(),
      };

      // Initial state
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual({ message: 'Success' });
    });

    it('transitions to success state after successful upload', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'Upload completed' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'test.zip', { type: 'application/zip' }),
          progress: 100,
          status: 'success' as const,
          id: 'success-test',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual({ message: 'Upload completed' });
    });

    it('transitions to error state on upload failure', async () => {
      const error = new Error('Network connection failed');
      mockUploadZipFile.mockRejectedValueOnce(error);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'test.zip', { type: 'application/zip' }),
          progress: 50,
          status: 'error' as const,
          id: 'error-test',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBe(error);
    });
  });

  describe('Progress tracking', () => {
    it('supports progress tracking through onProgress callback', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'Upload with progress' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockOnProgress = jest.fn();
      const mockPayload = {
        fileUpload: {
          file: new File(['content'], 'progress-test.zip', { type: 'application/zip' }),
          progress: 75,
          status: 'uploading' as const,
          id: 'progress-test',
        },
        onProgress: mockOnProgress,
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUploadZipFile).toHaveBeenCalledWith(
        expect.objectContaining({
          onProgress: mockOnProgress,
        })
      );
    });
  });

  describe('File handling', () => {
    it('handles different file types correctly', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'File processed' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const mockFile = new File(['plugin data'], 'my-plugin.zip', { 
        type: 'application/zip',
        lastModified: Date.now(),
      });

      const mockPayload = {
        fileUpload: {
          file: mockFile,
          progress: 0,
          status: 'idle' as const,
          id: 'file-type-test',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUploadZipFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileUpload: expect.objectContaining({
            file: mockFile,
          }),
        })
      );
    });

    it('handles large files correctly', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'Large file uploaded' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      // Create a larger file (simulated)
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
      const largeFile = new File([largeContent], 'large-plugin.zip', { 
        type: 'application/zip' 
      });

      const mockPayload = {
        fileUpload: {
          file: largeFile,
          progress: 0,
          status: 'idle' as const,
          id: 'large-file-test',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUploadZipFile).toHaveBeenCalledWith(mockPayload);
    });
  });

  describe('Edge cases', () => {
    it('handles multiple consecutive uploads', async () => {
      mockUploadZipFile
        .mockResolvedValueOnce({ message: 'First upload' })
        .mockResolvedValueOnce({ message: 'Second upload' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const firstPayload = {
        fileUpload: {
          file: new File(['first'], 'first.zip', { type: 'application/zip' }),
          progress: 0,
          status: 'idle' as const,
          id: 'first-upload',
        },
        onProgress: jest.fn(),
      };

      // First upload
      result.current.mutate(firstPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('First upload');

      // Reset for second upload
      result.current.reset();

      const secondPayload = {
        fileUpload: {
          file: new File(['second'], 'second.zip', { type: 'application/zip' }),
          progress: 0,
          status: 'idle' as const,
          id: 'second-upload',
        },
        onProgress: jest.fn(),
      };

      // Second upload
      result.current.mutate(secondPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('Second upload');
      expect(mockOnSuccess).toHaveBeenCalledTimes(2);
    });

    it('handles empty file gracefully', async () => {
      mockUploadZipFile.mockResolvedValueOnce({ message: 'Empty file processed' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useUploadFiles({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
        { wrapper }
      );

      const emptyFile = new File([], 'empty.zip', { type: 'application/zip' });
      const mockPayload = {
        fileUpload: {
          file: emptyFile,
          progress: 0,
          status: 'idle' as const,
          id: 'empty-file-test',
        },
        onProgress: jest.fn(),
      };

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUploadZipFile).toHaveBeenCalledWith(mockPayload);
    });
  });
}); 