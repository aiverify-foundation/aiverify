import { uploadDatasetFile } from '../uploadDatasetFile';
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

describe('uploadDatasetFile', () => {
  const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
  const mockFileUpload: FileUpload = {
    file: mockFile,
    progress: 0,
    status: 'idle',
    id: 'test-upload-1',
  };

  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockXHR.status = 200;
    mockXHR.responseText = '{"success": true}';
    mockXHR.upload.onprogress = null;
    mockXHR.onload = null;
    mockXHR.onerror = null;
  });

  describe('XHR Setup', () => {
    it('opens XHR with correct method and URL', async () => {
      const promise = uploadDatasetFile({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      expect(mockXHR.open).toHaveBeenCalledWith('POST', '/api/test_datasets/upload');
      expect(mockXHR.send).toHaveBeenCalled();

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('sends FormData with file', async () => {
      const promise = uploadDatasetFile({
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
      const promise = uploadDatasetFile({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('files')).toBe(mockFile);

      // Resolve the promise
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });
  });

  describe('Progress Tracking', () => {
    it('calls onProgress with correct percentage', async () => {
      const promise = uploadDatasetFile({
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
      const promise = uploadDatasetFile({
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
  });

  describe('Success Handling', () => {
    it('resolves with response data on successful upload', async () => {
      mockXHR.status = 200;
      mockXHR.responseText = '{"message": "Upload successful"}';
      
      const promise = uploadDatasetFile({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });
      
      // Simulate successful upload
      if (mockXHR.onload) {
        mockXHR.onload();
      }
      
      const result = await promise;
      expect(result).toEqual({"message": "Upload successful"});
    });
  });

  describe('Error Handling', () => {
    it('rejects with network error on XHR error', async () => {
      const promise = uploadDatasetFile({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      if (mockXHR.onerror) {
        mockXHR.onerror();
      }

      await expect(promise).rejects.toThrow('Network error');
    });

    it('rejects with parsed error on HTTP error status', async () => {
      mockXHR.status = 400;
      mockXHR.responseText = '{"detail": "Bad request", "status_code": 400}';

      const promise = uploadDatasetFile({
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      });

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await expect(promise).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles files with special characters in name', async () => {
      const specialFile = new File(['content'], 'test@#$%^&*().csv', { type: 'text/csv' });
      const specialFileUpload: FileUpload = {
        file: specialFile,
        progress: 0,
        status: 'idle',
        id: 'special-upload',
      };

      const promise = uploadDatasetFile({
        fileUpload: specialFileUpload,
        onProgress: mockOnProgress,
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('files')).toBe(specialFile);

      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });

    it('handles files with no content', async () => {
      const emptyFile = new File([], 'empty.csv', { type: 'text/csv' });
      const emptyFileUpload: FileUpload = {
        file: emptyFile,
        progress: 0,
        status: 'idle',
        id: 'empty-upload',
      };

      const promise = uploadDatasetFile({
        fileUpload: emptyFileUpload,
        onProgress: mockOnProgress,
      });

      const sentData = mockXHR.send.mock.calls[0][0] as FormData;
      expect(sentData.get('files')).toBe(emptyFile);

      if (mockXHR.onload) {
        mockXHR.onload();
      }
      await promise;
    });
  });
}); 