import { uploadJsonFile, UploadRequestPayload } from '../uploadJsonFile';
import { FileUpload } from '@/app/templates/types';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  static DONE = 4;
  static LOADING = 3;
  static HEADERS_RECEIVED = 2;
  static OPENED = 1;
  static UNSENT = 0;

  open = jest.fn();
  send = jest.fn();
  setRequestHeader = jest.fn();
  getResponseHeader = jest.fn();
  getAllResponseHeaders = jest.fn();
  
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onprogress: ((event: any) => void) | null = null;
  
  upload = {
    onprogress: null as ((event: any) => void) | null,
  };
  
  status = 200;
  statusText = 'OK';
  responseText = '{"message": "success"}';
  readyState = MockXMLHttpRequest.DONE;
  
  constructor() {
    // Default mock implementations
    this.getAllResponseHeaders.mockReturnValue('content-type: application/json\r\n');
    this.getResponseHeader.mockImplementation((header: string) => {
      if (header.toLowerCase() === 'content-type') {
        return 'application/json';
      }
      return null;
    });
  }
}

global.XMLHttpRequest = MockXMLHttpRequest as any;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('uploadJsonFile', () => {
  const mockOnProgress = jest.fn();
  
  const createMockFileUpload = (content: string = '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}', filename: string = 'test.json'): FileUpload => ({
    id: 'test-id',
    file: new File([content], filename, { type: 'application/json' }),
    progress: 0,
    status: 'idle',
    processedData: {
      projectInfo: { name: 'Test', description: 'Test' },
      globalVars: [],
      pages: [],
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockOnProgress.mockClear();
  });

  describe('File reading functionality', () => {
    beforeEach(() => {
      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: null as any,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    it('should read JSON file successfully', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      // Mock successful fetch response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'success' }),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      fileReader.result = '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}';
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      const response = await result;
      expect(response).toEqual({ message: 'success' });
      expect(FileReader).toHaveBeenCalled();
    });

    it('should handle FileReader errors', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      const result = uploadJsonFile(payload);

      // Simulate FileReader error
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onerror();
      }, 0);

      await expect(result).rejects.toThrow('Failed to extract JSON content: Error reading file');
    });

    it('should handle invalid JSON content', async () => {
      const mockFileUpload = createMockFileUpload('invalid json');
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      const result = uploadJsonFile(payload);

      // Simulate FileReader success with invalid JSON
      const fileReader = (FileReader as any).mock.results[0].value;
      fileReader.result = 'invalid json';
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Failed to extract JSON content: Invalid JSON content');
    });

    it('should handle FileReader with no result', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      const result = uploadJsonFile(payload);

      // Simulate FileReader success with no result
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: null } });
      }, 0);

      await expect(result).rejects.toThrow('Failed to extract JSON content: Failed to read file content');
    });
  });

  describe('Upload functionality (using current implementation)', () => {
    beforeEach(() => {
      // Mock FileReader for successful JSON reading
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    it('should upload JSON successfully', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'Upload successful' }),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      const response = await result;

      expect(mockFetch).toHaveBeenCalledWith('/api/project_templates/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectInfo: { name: 'Test', description: 'Test' }, globalVars: [], pages: [] }),
      });

      expect(mockOnProgress).toHaveBeenCalledWith(100);
      expect(response).toEqual({ message: 'Upload successful' });
    });

    it('should handle upload errors with status 400', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Fetch API - Request failed with status 400: Bad Request');
    });

    it('should handle upload errors with status 422', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve('{"error": "Validation failed"}'),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Fetch API - Request failed with status 422: {"error": "Validation failed"}');
    });

    it('should handle upload errors with status 413', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 413,
        text: () => Promise.resolve('Payload Too Large'),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Fetch API - Request failed with status 413: Payload Too Large');
    });

    it('should handle upload errors with status 500', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Fetch API - Request failed with status 500: Internal Server Error');
    });

    it('should handle network errors', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Network error');
    });
  });

  describe('Progress tracking', () => {
    beforeEach(() => {
      // Mock FileReader for successful JSON reading
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    it('should track progress completion', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'success' }),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await result;

      expect(mockOnProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('Error response handling', () => {
    beforeEach(() => {
      // Mock FileReader for successful JSON reading
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    it('should handle JSON error responses', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve('{"error": "Validation failed", "details": ["Name is required"]}'),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Fetch API - Request failed with status 422');
    });

    it('should handle unexpected status codes', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 418,
        text: () => Promise.resolve('I\'m a teapot'),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow('Fetch API - Request failed with status 418: I\'m a teapot');
    });
  });

  describe('Logging and debugging', () => {
    beforeEach(() => {
      // Mock FileReader for successful JSON reading
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    it('should log extraction and upload process', async () => {
      const mockFileUpload = createMockFileUpload();
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'success' }),
      });

      const result = uploadJsonFile(payload);

      // Simulate FileReader success
      const fileReader = (FileReader as any).mock.results[0].value;
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await result;

      expect(console.log).toHaveBeenCalledWith('Extracted JSON content:', { projectInfo: { name: 'Test', description: 'Test' }, globalVars: [], pages: [] });
      expect(console.log).toHaveBeenCalledWith('Using fetch API approach with extracted JSON content');
    });

    it('should log error details', async () => {
      const mockFileUpload = createMockFileUpload('invalid json');
      const payload: UploadRequestPayload = {
        fileUpload: mockFileUpload,
        onProgress: mockOnProgress,
      };

      const result = uploadJsonFile(payload);

      // Simulate FileReader success with invalid JSON
      const fileReader = (FileReader as any).mock.results[0].value;
      fileReader.result = 'invalid json';
      setTimeout(() => {
        fileReader.onload({ target: { result: fileReader.result } });
      }, 0);

      await expect(result).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('Error extracting JSON content from file:', expect.any(Error));
    });
  });
}); 