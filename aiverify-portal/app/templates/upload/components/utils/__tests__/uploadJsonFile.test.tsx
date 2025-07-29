import { FileUpload } from '@/app/templates/types';
import { uploadJsonFile, UploadRequestPayload, uploadJsonWithXhr, uploadJsonWithFetch, readFileAsJson } from '../uploadJsonFile';

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
  addEventListener = jest.fn();
  
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

const mockXMLHttpRequest = jest.fn(() => new MockXMLHttpRequest());
global.XMLHttpRequest = mockXMLHttpRequest as any;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  mockXMLHttpRequest.mockClear();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('uploadJsonFile', () => {
  const mockOnProgress = jest.fn();
  
  const createMockFileUpload = (content = '{"projectInfo": {"name": "Test", "description": "Test"}, "globalVars": [], "pages": []}', filename = 'test.json'): FileUpload => ({
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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onerror();

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: null } });

      await expect(result).rejects.toThrow('Failed to extract JSON content: Failed to read file content');
    });
  });

  describe('Upload functionality', () => {
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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

      await expect(result).rejects.toThrow('Network error');
    });

    it('should handle JSON error response parsing', async () => {
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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

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
      fileReader.onload({ target: { result: fileReader.result } });

      await expect(result).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('Error extracting JSON content from file:', expect.any(Error));
    });
  });
});

describe('readFileAsJson', () => {
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
    const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
    
    const result = readFileAsJson(file);

    // Simulate FileReader success
    const fileReader = (FileReader as any).mock.results[0].value;
    fileReader.result = '{"test": "data"}';
    fileReader.onload({ target: { result: fileReader.result } });

    const response = await result;
    expect(response).toEqual({ test: 'data' });
  });

  it('should handle FileReader error', async () => {
    const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
    
    const result = readFileAsJson(file);

    // Simulate FileReader error
    const fileReader = (FileReader as any).mock.results[0].value;
    fileReader.onerror();

    await expect(result).rejects.toThrow('Error reading file');
  });

  it('should handle invalid JSON content', async () => {
    const file = new File(['invalid json'], 'test.json', { type: 'application/json' });
    
    const result = readFileAsJson(file);

    // Simulate FileReader success with invalid JSON
    const fileReader = (FileReader as any).mock.results[0].value;
    fileReader.result = 'invalid json';
    fileReader.onload({ target: { result: fileReader.result } });

    await expect(result).rejects.toThrow('Invalid JSON content');
  });

  it('should handle FileReader with no result', async () => {
    const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
    
    const result = readFileAsJson(file);

    // Simulate FileReader success with no result
    const fileReader = (FileReader as any).mock.results[0].value;
    fileReader.onload({ target: { result: null } });

    await expect(result).rejects.toThrow('Failed to read file content');
  });
});

describe('uploadJsonWithFetch', () => {
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockOnProgress.mockClear();
  });

  it('should upload JSON successfully', async () => {
    const jsonContent = { test: 'data' };
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'success' }),
    });

    const result = await uploadJsonWithFetch(jsonContent, mockOnProgress);

    expect(mockFetch).toHaveBeenCalledWith('/api/project_templates/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonContent),
    });

    expect(mockOnProgress).toHaveBeenCalledWith(100);
    expect(result).toEqual({ message: 'success' });
  });

  it('should handle error response', async () => {
    const jsonContent = { test: 'data' };
    
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    });

    await expect(uploadJsonWithFetch(jsonContent, mockOnProgress)).rejects.toThrow(
      'Fetch API - Request failed with status 400: Bad Request'
    );
  });

  it('should handle JSON error response parsing', async () => {
    const jsonContent = { test: 'data' };
    
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve('{"error": "Validation failed"}'),
    });

    await expect(uploadJsonWithFetch(jsonContent, mockOnProgress)).rejects.toThrow(
      'Fetch API - Request failed with status 422: {"error": "Validation failed"}'
    );
  });

  it('should handle network error', async () => {
    const jsonContent = { test: 'data' };
    
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(uploadJsonWithFetch(jsonContent, mockOnProgress)).rejects.toThrow('Network error');
  });
});

describe('uploadJsonWithXhr', () => {
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnProgress.mockClear();
  });

  it('should upload JSON successfully', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR success
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 200;
    xhrInstance.responseText = '{"message": "success"}';
    xhrInstance.getResponseHeader.mockReturnValue('application/json');
    xhrInstance.onload();

    const response = await result;
    expect(response).toEqual({ message: 'success' });
  });

  it('should handle XHR error with non-JSON response', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR success but with non-JSON content type
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 200;
    xhrInstance.responseText = '{"message": "success"}';
    xhrInstance.getResponseHeader.mockReturnValue('text/plain');
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Expected JSON response, but received something else');
  });

  it('should handle XHR JSON parsing error', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR success but with invalid JSON
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 200;
    xhrInstance.responseText = 'invalid json';
    xhrInstance.getResponseHeader.mockReturnValue('application/json');
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Invalid JSON response from server');
  });

  it('should handle XHR 422 validation error', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR 422 error
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 422;
    xhrInstance.statusText = 'Unprocessable Entity';
    xhrInstance.responseText = 'Validation failed';
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Validation error (422): Validation failed');
  });

  it('should handle XHR 413 payload too large error', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR 413 error
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 413;
    xhrInstance.statusText = 'Payload Too Large';
    xhrInstance.responseText = 'File too large';
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Body exceeded size limit');
  });

  it('should handle XHR 500 server error', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR 500 error
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 500;
    xhrInstance.statusText = 'Internal Server Error';
    xhrInstance.responseText = 'Server error';
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Server error (500): Internal Server Error');
  });

  it('should handle XHR 502 server error', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR 502 error
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 502;
    xhrInstance.statusText = 'Bad Gateway';
    xhrInstance.responseText = 'Gateway error';
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Server error (502): Bad Gateway');
  });

  it('should handle XHR unexpected error status', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR unexpected error
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 418;
    xhrInstance.statusText = 'I\'m a teapot';
    xhrInstance.responseText = 'Teapot error';
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Unexpected error: I\'m a teapot');
  });

  it('should handle XHR network error', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR network error
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.onerror({ type: 'error' });

    await expect(result).rejects.toThrow('Network error');
  });

  it('should handle XHR progress tracking', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR progress
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });

    // Simulate XHR success
    xhrInstance.status = 200;
    xhrInstance.responseText = '{"message": "success"}';
    xhrInstance.getResponseHeader.mockReturnValue('application/json');
    xhrInstance.onload();

    await result;

    expect(mockOnProgress).toHaveBeenCalledWith(50);
  });

  it('should handle XHR progress with non-computable length', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR progress with non-computable length
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.upload.onprogress({ lengthComputable: false, loaded: 50, total: 0 });

    // Simulate XHR success
    xhrInstance.status = 200;
    xhrInstance.responseText = '{"message": "success"}';
    xhrInstance.getResponseHeader.mockReturnValue('application/json');
    xhrInstance.onload();

    await result;

    // Should not call onProgress when length is not computable
    expect(mockOnProgress).not.toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle XHR JSON error response parsing', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR error with JSON response
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 422;
    xhrInstance.statusText = 'Unprocessable Entity';
    xhrInstance.responseText = '{"error": "Validation failed"}';
    xhrInstance.getResponseHeader.mockReturnValue('application/json');
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Validation error (422): {"error": "Validation failed"}');
  });

  it('should handle XHR error response parsing failure', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR error with invalid JSON response
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 422;
    xhrInstance.statusText = 'Unprocessable Entity';
    xhrInstance.responseText = 'invalid json response';
    xhrInstance.getResponseHeader.mockReturnValue('application/json');
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Validation error (422): invalid json response');
  });

  it('should handle XHR server error with no status text', async () => {
    const jsonContent = { test: 'data' };
    
    const result = uploadJsonWithXhr(jsonContent, mockOnProgress);

    // Simulate XHR 500 error with no status text
    const xhrInstance = mockXMLHttpRequest.mock.results[0].value;
    xhrInstance.status = 500;
    xhrInstance.statusText = '';
    xhrInstance.responseText = 'Server error';
    xhrInstance.onload();

    await expect(result).rejects.toThrow('Server error (500): An unexpected error occurred.');
  });
}); 