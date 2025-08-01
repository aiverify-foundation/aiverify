import { uploadZipFile } from '../uploadZipFile';

describe('uploadZipFile', () => {
  let originalXMLHttpRequest: any;
  beforeEach(() => {
    originalXMLHttpRequest = global.XMLHttpRequest;
  });
  afterEach(() => {
    global.XMLHttpRequest = originalXMLHttpRequest;
  });

  function mockXHR({ status = 200, responseText = '"success"', triggerError = false, progress = 100 } = {}) {
    const xhrMock: any = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      upload: {},
      onload: null,
      onerror: null,
      onprogress: null,
      status,
      responseText,
      UNSENT: 0,
      OPENED: 1,
      HEADERS_RECEIVED: 2,
      LOADING: 3,
      DONE: 4,
    };
    global.XMLHttpRequest = jest.fn(() => xhrMock) as any;
    return xhrMock;
  }

  it('resolves with result on success and calls onProgress', async () => {
    const xhr = mockXHR({ status: 200, responseText: '"success"' });
    const onProgress = jest.fn();
    const promise = uploadZipFile({
      fileUpload: { file: new File([''], 'test.zip'), progress: 0, status: 'idle', id: '1' },
      onProgress,
    });
    // Simulate progress
    xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
    // Simulate load
    xhr.onload();
    const result = await promise;
    expect(result).toBe('success');
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('rejects with parsed error on API error', async () => {
    const errorDetail = { detail: 'Upload failed' };
    const xhr = mockXHR({ status: 400, responseText: JSON.stringify(errorDetail) });
    const onProgress = jest.fn();
    // Mock parseFastAPIError to just return the error detail as an Error
    jest.mock('@/lib/utils/parseFastAPIError', () => ({
      parseFastAPIError: (err: any) => new Error(err.detail),
    }));
    const promise = uploadZipFile({
      fileUpload: { file: new File([''], 'fail.zip'), progress: 0, status: 'idle', id: '1' },
      onProgress,
    });
    xhr.onload();
    await expect(promise).rejects.toThrow('Upload failed');
  });

  it('rejects with network error', async () => {
    const xhr = mockXHR();
    const onProgress = jest.fn();
    const promise = uploadZipFile({
      fileUpload: { file: new File([''], 'fail.zip'), progress: 0, status: 'idle', id: '1' },
      onProgress,
    });
    xhr.onerror();
    await expect(promise).rejects.toThrow('Network error');
  });
}); 