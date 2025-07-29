import { FileUpload } from '@/app/plugins/utils/types';
import { uploadZipFile, UploadRequestPayload } from '../uploadZipFile';

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  public readyState = 0;
  public status = 0;
  public statusText = '';
  public responseText = '';
  public upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public headers: Record<string, string> = {};
  
  open(method: string, url: string) {
    // Mock implementation
  }
  
  send(data: FormData) {
    // Mock implementation - will be overridden in tests
  }
  
  setRequestHeader(header: string, value: string) {
    this.headers[header] = value;
  }
  
  getResponseHeader(header: string) {
    return this.headers[header] || null;
  }
}

// Override global XMLHttpRequest
(global as any).XMLHttpRequest = MockXMLHttpRequest;

describe('uploadZipFile', () => {
  let mockXHR: MockXMLHttpRequest;
  let mockFile: File;
  let mockFileUpload: FileUpload;
  let mockOnProgress: jest.Mock;
  let payload: UploadRequestPayload;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock file
    mockFile = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
    
    // Create a mock FileUpload object
    mockFileUpload = {
      id: 'test-id',
      file: mockFile,
      progress: 0,
      status: 'idle',
    };
    
    // Create mock progress callback
    mockOnProgress = jest.fn();
    
    // Create payload
    payload = {
      fileUpload: mockFileUpload,
      onProgress: mockOnProgress,
    };
    
    // Reset XMLHttpRequest mock
    mockXHR = new MockXMLHttpRequest();
  });

  describe('Successful Upload', () => {
    it('successfully uploads a file and returns success message', async () => {
      const mockResponse = { message: 'Upload successful' };
      
      // Mock successful upload
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        // Simulate progress
        if (this.upload.onprogress) {
          this.upload.onprogress({ loaded: 50, total: 100, lengthComputable: true } as ProgressEvent);
          this.upload.onprogress({ loaded: 100, total: 100, lengthComputable: true } as ProgressEvent);
        }
        
        // Set successful response
        this.status = 200;
        this.responseText = JSON.stringify(mockResponse);
        this.headers['Content-Type'] = 'application/json';
        
        // Trigger onload
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      const result = await uploadZipFile(payload);
      
      expect(result).toEqual(mockResponse);
      expect(mockOnProgress).toHaveBeenCalledWith(50);
      expect(mockOnProgress).toHaveBeenCalledWith(100);
    });

    it('handles successful upload with different response format', async () => {
      const mockResponse = { message: 'Plugin uploaded successfully', id: 'plugin-123' };
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = JSON.stringify(mockResponse);
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      const result = await uploadZipFile(payload);
      
      expect(result).toEqual(mockResponse);
    });

    it('tracks upload progress correctly', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        if (this.upload.onprogress) {
          // Simulate progressive upload
          this.upload.onprogress({ loaded: 25, total: 100, lengthComputable: true } as ProgressEvent);
          this.upload.onprogress({ loaded: 50, total: 100, lengthComputable: true } as ProgressEvent);
          this.upload.onprogress({ loaded: 75, total: 100, lengthComputable: true } as ProgressEvent);
          this.upload.onprogress({ loaded: 100, total: 100, lengthComputable: true } as ProgressEvent);
        }
        
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Success' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await uploadZipFile(payload);
      
      expect(mockOnProgress).toHaveBeenCalledWith(25);
      expect(mockOnProgress).toHaveBeenCalledWith(50);
      expect(mockOnProgress).toHaveBeenCalledWith(75);
      expect(mockOnProgress).toHaveBeenCalledWith(100);
    });

    it('handles progress events without lengthComputable', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        if (this.upload.onprogress) {
          this.upload.onprogress({ loaded: 50, total: 100, lengthComputable: false } as ProgressEvent);
        }
        
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Success' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await uploadZipFile(payload);
      
      // Should not call onProgress when lengthComputable is false
      expect(mockOnProgress).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles 413 body size limit error', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 413;
        this.statusText = 'Payload Too Large';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        'Body exceeded 1 MB limit. To configure the body size limit for Server Actions, see: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit'
      );
    });

    it('handles 500 server error', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 500;
        this.statusText = 'Internal Server Error';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        'Server error (500): Internal Server Error'
      );
    });

    it('handles other 5xx server errors', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 502;
        this.statusText = 'Bad Gateway';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        'Server error (502): Bad Gateway'
      );
    });

    it('handles server error without status text', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 500;
        this.statusText = '';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        'Server error (500): An unexpected error occurred.'
      );
    });

    it('handles unexpected error codes', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 400;
        this.statusText = 'Bad Request';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        'Unexpected error: Bad Request'
      );
    });

    it('handles network errors', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        new Error('Network error')
      );
    });

    it('handles invalid JSON response', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = 'invalid json';
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        new Error('Invalid JSON response from server')
      );
    });

    it('handles non-JSON response', async () => {
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = 'HTML response';
        this.headers['Content-Type'] = 'text/html';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        new Error('Expected JSON response, but received something else')
      );
    });
  });

  describe('Request Configuration', () => {
    it('configures XMLHttpRequest correctly', async () => {
      const mockOpen = jest.fn();
      const mockSend = jest.fn();
      
      MockXMLHttpRequest.prototype.open = mockOpen;
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        mockSend(data);
        
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Success' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await uploadZipFile(payload);
      
      expect(mockOpen).toHaveBeenCalledWith('POST', '/api/plugins/upload');
      expect(mockSend).toHaveBeenCalledWith(expect.any(FormData));
    });

    it('sends file data in FormData', async () => {
      let capturedFormData: FormData;
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        capturedFormData = data;
        
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Success' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await uploadZipFile(payload);
      
      expect(capturedFormData!.get('file')).toEqual(mockFile);
    });
  });

  describe('Edge Cases', () => {
    it('handles very large files', async () => {
      const largeFile = new File(['x'.repeat(1000000)], 'large-plugin.zip', { type: 'application/zip' });
      const largeFileUpload: FileUpload = {
        id: 'large-id',
        file: largeFile,
        progress: 0,
        status: 'idle',
      };
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        if (this.upload.onprogress) {
          this.upload.onprogress({ loaded: 1000000, total: 1000000, lengthComputable: true } as ProgressEvent);
        }
        
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Large file uploaded' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      const result = await uploadZipFile({
        fileUpload: largeFileUpload,
        onProgress: mockOnProgress,
      });
      
      expect(result).toEqual({ message: 'Large file uploaded' });
      expect(mockOnProgress).toHaveBeenCalledWith(100);
    });

    it('handles files with special characters in names', async () => {
      const specialFile = new File(['content'], 'plugin-with-special-chars@#$.zip', { type: 'application/zip' });
      const specialFileUpload: FileUpload = {
        id: 'special-id',
        file: specialFile,
        progress: 0,
        status: 'idle',
      };
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Special file uploaded' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      const result = await uploadZipFile({
        fileUpload: specialFileUpload,
        onProgress: mockOnProgress,
      });
      
      expect(result).toEqual({ message: 'Special file uploaded' });
    });

    it('handles empty files', async () => {
      const emptyFile = new File([], 'empty-plugin.zip', { type: 'application/zip' });
      const emptyFileUpload: FileUpload = {
        id: 'empty-id',
        file: emptyFile,
        progress: 0,
        status: 'idle',
      };
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Empty file processed' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      const result = await uploadZipFile({
        fileUpload: emptyFileUpload,
        onProgress: mockOnProgress,
      });
      
      expect(result).toEqual({ message: 'Empty file processed' });
    });
  });

  describe('Console Logging', () => {
    it('logs successful upload information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = JSON.stringify({ message: 'Success' });
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await uploadZipFile(payload);
      
      expect(consoleSpy).toHaveBeenCalledWith('Status 200: Successful upload');
      expect(consoleSpy).toHaveBeenCalledWith('Response:', JSON.stringify({ message: 'Success' }));
      expect(consoleSpy).toHaveBeenCalledWith('type: ', 'application/json');
      
      consoleSpy.mockRestore();
    });

    it('logs JSON parsing errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      MockXMLHttpRequest.prototype.send = function(data: FormData) {
        this.status = 200;
        this.responseText = 'invalid json';
        this.headers['Content-Type'] = 'application/json';
        
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      };
      
      await expect(uploadZipFile(payload)).rejects.toEqual(
        new Error('Invalid JSON response from server')
      );
      
      expect(consoleSpy).toHaveBeenCalledWith('Error during JSON parsing:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
}); 