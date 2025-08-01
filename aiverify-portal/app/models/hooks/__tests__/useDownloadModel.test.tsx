import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useModelData } from '../useDownloadModel';

// Mock the fetch function
global.fetch = jest.fn();

describe('useDownloadModel', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('successful download', () => {
    it('fetches model data successfully', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="test-model.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test_models/download/123');
      expect(result.current.data).toEqual({
        blob: mockBlob,
        filename: 'test-model.zip',
      });
    });

    it('extracts filename from content disposition header', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="my-model-v2.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('456'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.filename).toBe('my-model-v2.zip');
    });

    it('handles different filename formats', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="model_with_underscores.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('789'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.filename).toBe('model_with_underscores.zip');
    });
  });

  describe('error handling', () => {
    it('handles HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('999'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('HTTP error! status: 404'));
    });

    it('handles missing content disposition header', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map(),
        blob: jest.fn().mockResolvedValue(new Blob()),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error('Expected attachment but did not receive one.')
      );
    });

    it('handles content disposition without attachment', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'inline; filename="test.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(new Blob()),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error('Expected attachment but did not receive one.')
      );
    });

    it('handles missing filename in content disposition', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment'],
        ]),
        blob: jest.fn().mockResolvedValue(new Blob()),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error('Filename could not be extracted from content-disposition.')
      );
    });

    it('handles malformed filename in content disposition', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename='],
        ]),
        blob: jest.fn().mockResolvedValue(new Blob()),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error('Filename could not be extracted from content-disposition.')
      );
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
    });
  });

  describe('query behavior', () => {
    it('is disabled when id is empty', () => {
      const { result } = renderHook(() => useModelData(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('is disabled when id is null', () => {
      const { result } = renderHook(() => useModelData(null as any), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('is enabled when id is provided', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="test.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      expect(result.current.isFetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('uses correct query key', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="test.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that the query is cached with the correct key
      const cachedData = queryClient.getQueryData(['model', '123']);
      expect(cachedData).toEqual({
        blob: mockBlob,
        filename: 'test.zip',
      });
    });

    it('tracks loading state correctly', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="test.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
      });
    });
  });

  describe('blob handling', () => {
    it('returns blob with correct type', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="test.zip"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.blob).toBe(mockBlob);
      expect(result.current.data?.blob.type).toBe('application/zip');
    });

    it('handles different blob types', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/octet-stream' });
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['Content-Disposition', 'attachment; filename="test.bin"'],
        ]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useModelData('123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.blob.type).toBe('application/octet-stream');
    });
  });
}); 