import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadFiles, fileUploadRequest } from '../useUploadFile';
import { FileUpload } from '@/app/datasets/upload/types';

// Mock XMLHttpRequest
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  upload: {
    onprogress: null as ((event: ProgressEvent) => void) | null,
  },
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  status: 200,
  responseText: '{"success": true}',
};

// Mock global XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

// Mock fetch
global.fetch = jest.fn();

describe('useUploadFile', () => {
  const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
  const mockFileUpload: FileUpload = {
    file: mockFile,
    progress: 0,
    status: 'idle',
    id: 'test-upload-1',
  };

  const mockOnProgress = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockXHR.status = 200;
    mockXHR.responseText = '{"success": true}';
    mockXHR.upload.onprogress = null;
    mockXHR.onload = null;
    mockXHR.onerror = null;
  });

  describe('fileUploadRequest', () => {
    it('creates XHR with correct method and URL', async () => {
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      expect(mockXHR.open).toHaveBeenCalledWith('POST', '/api/mock/upload');
      expect(mockXHR.send).toHaveBeenCalled();

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('sends FormData with file', async () => {
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      expect(mockXHR.send).toHaveBeenCalled();
      const sentData = mockXHR.send.mock.calls[0][0];
      expect(sentData).toBeInstanceOf(FormData);

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('appends file to FormData with correct field name', async () => {
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('file')).toBe(mockFile);

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('calls onProgress with correct percentage', async () => {
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      // Simulate progress event
      if (mockXHR.upload.onprogress) {
        const progressEvent = {
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent;
        mockXHR.upload.onprogress(progressEvent);
      }

      expect(mockOnProgress).toHaveBeenCalledWith(50);

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('handles progress when length is not computable', async () => {
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      // Simulate progress event with non-computable length
      if (mockXHR.upload.onprogress) {
        const progressEvent = {
          lengthComputable: false,
          loaded: 50,
          total: 100,
        } as ProgressEvent;
        mockXHR.upload.onprogress(progressEvent);
      }

      expect(mockOnProgress).not.toHaveBeenCalled();

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('resolves with response data on successful upload', async () => {
      mockXHR.status = 200;
      mockXHR.responseText = '{"message": "Upload successful"}';
      
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      // Simulate successful upload by calling onload
      if (mockXHR.onload) {
        mockXHR.onload();
      }

      const result = await promise;
      expect(result).toEqual({"message": "Upload successful"});
    }, 15000); // Increase timeout to 15 seconds

    it('rejects with network error on XHR error', async () => {
      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      if (mockXHR.onerror) {
        mockXHR.onerror();
      }

      await expect(promise).rejects.toThrow('Network error');
    });

    it('rejects with error on HTTP error status', async () => {
      mockXHR.status = 400;
      mockXHR.responseText = '{"detail": "Bad request"}';

      const promise = fileUploadRequest({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await expect(promise).rejects.toThrow('Upload failed');
    });
  });

  describe('useUploadFiles', () => {
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
      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
    });

    it('calls onSuccess when upload succeeds', async () => {
      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          fileUpload: mockFileUpload,
          onProgress: mockOnProgress,
        });
      });

      // Simulate successful upload
      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('calls onError when upload fails', async () => {
      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      // Mock XHR to fail
      mockXHR.status = 400;
      mockXHR.responseText = '{"detail": "Bad request"}';

      await act(async () => {
        result.current.mutate({
          fileUpload: mockFileUpload,
          onProgress: mockOnProgress,
        });
      });

      // Simulate failed upload
      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOnError).toHaveBeenCalled();
    });

    it('handles network errors', async () => {
      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          fileUpload: mockFileUpload,
          onProgress: mockOnProgress,
        });
      });

      // Simulate network error
      if (mockXHR.onerror) {
        mockXHR.onerror();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOnError).toHaveBeenCalled();
    });

    it('tracks upload progress', async () => {
      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          fileUpload: mockFileUpload,
          onProgress: mockOnProgress,
        });
      });

      // Simulate progress event
      if (mockXHR.upload.onprogress) {
        const progressEvent = {
          lengthComputable: true,
          loaded: 75,
          total: 100,
        } as ProgressEvent;
        mockXHR.upload.onprogress(progressEvent);
      }

      expect(mockOnProgress).toHaveBeenCalledWith(75);

      // Complete upload
      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });

    it('handles files with special characters in names', async () => {
      const specialFile = new File(['content'], 'test@#$%^&*().csv', { type: 'text/csv' });
      const specialFileUpload: FileUpload = {
        file: specialFile,
        progress: 0,
        status: 'idle',
        id: 'special-upload',
      };

      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          fileUpload: specialFileUpload,
          onProgress: mockOnProgress,
        });
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('file')).toBe(specialFile);

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });

    it('handles empty files', async () => {
      const emptyFile = new File([], 'empty.csv', { type: 'text/csv' });
      const emptyFileUpload: FileUpload = {
        file: emptyFile,
        progress: 0,
        status: 'idle',
        id: 'empty-upload',
      };

      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          fileUpload: emptyFileUpload,
          onProgress: mockOnProgress,
        });
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('file')).toBe(emptyFile);

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });

    it('handles very large files', async () => {
      const largeFile = new File(['x'.repeat(1000000)], 'large.csv', { type: 'text/csv' });
      const largeFileUpload: FileUpload = {
        file: largeFile,
        progress: 0,
        status: 'idle',
        id: 'large-upload',
      };

      const { result } = renderHook(
        () => useUploadFiles({ onSuccess: mockOnSuccess, onError: mockOnError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          fileUpload: largeFileUpload,
          onProgress: mockOnProgress,
        });
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('file')).toBe(largeFile);

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });
  });
}); 