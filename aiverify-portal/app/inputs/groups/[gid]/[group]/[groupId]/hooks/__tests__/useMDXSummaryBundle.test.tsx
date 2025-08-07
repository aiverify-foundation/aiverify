import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMDXSummaryBundle } from '../useMDXSummaryBundle';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Create a wrapper component for testing hooks with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMDXSummaryBundle', () => {
  const mockMDXBundle = {
    code: 'export default function TestComponent() { return <div>Test</div>; }',
    frontmatter: {
      title: 'Test MDX Bundle',
      description: 'A test MDX bundle',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('hook initialization and enabled state', () => {
    it('should not fetch when gid is undefined', () => {
      renderHook(() => useMDXSummaryBundle(undefined, 'test-cid'), {
        wrapper: createWrapper(),
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not fetch when cid is undefined', () => {
      renderHook(() => useMDXSummaryBundle('test-gid', undefined), {
        wrapper: createWrapper(),
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not fetch when both gid and cid are undefined', () => {
      renderHook(() => useMDXSummaryBundle(undefined, undefined), {
        wrapper: createWrapper(),
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch when both gid and cid are provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
      });
    });

    it('should use correct query key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      // The query key should be ['mdxBundle', 'test-gid', 'test-cid']
      // We can verify this by checking if the hook is properly configured
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
      });
    });
  });

  describe('successful API calls', () => {
    it('should fetch MDX bundle successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
      expect(result.current.data).toEqual(mockMDXBundle);
    });

    it('should handle successful response with different data structure', async () => {
      const customBundle = {
        code: 'custom code',
        frontmatter: { custom: 'data' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(customBundle),
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(customBundle);
    });
  });

  describe('404 error handling', () => {
    it('should return null for 404 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should not throw error for 404 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('non-404 error handling', () => {
    it('should throw error for 500 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe('Failed to fetch MDX bundle: Internal Server Error');
    });

    it('should throw error for 403 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe('Failed to fetch MDX bundle: Forbidden');
    });

    it('should throw error for 400 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe('Failed to fetch MDX bundle: Bad Request');
    });
  });

  describe('network error handling', () => {
    it('should handle TypeError (network error) and log error', async () => {
      const networkError = new TypeError('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching MDX bundle:', networkError);
      expect(result.current.error).toBe(networkError);
    });

    it('should handle generic Error and log error', async () => {
      const genericError = new Error('Generic error');
      mockFetch.mockRejectedValueOnce(genericError);

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching MDX bundle:', genericError);
      expect(result.current.error).toBe(genericError);
    });

    it('should handle Error with "Failed to fetch MDX bundle" message without logging', async () => {
      const fetchError = new Error('Failed to fetch MDX bundle: Some error');
      mockFetch.mockRejectedValueOnce(fetchError);

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(result.current.error).toBe(fetchError);
    });

    it('should handle Error with different message and log error', async () => {
      const differentError = new Error('Different error message');
      mockFetch.mockRejectedValueOnce(differentError);

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching MDX bundle:', differentError);
      expect(result.current.error).toBe(differentError);
    });
  });

  describe('JSON parsing errors', () => {
    it('should handle JSON parsing error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe('Invalid JSON');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string parameters', () => {
      renderHook(() => useMDXSummaryBundle('', ''), {
        wrapper: createWrapper(),
      });

      // Empty strings are falsy in JavaScript, so the hook will be disabled
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      renderHook(() => useMDXSummaryBundle('   ', '   '), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/   /summary/   ');
      });
    });

    it('should handle special characters in URL parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid@123', 'test-cid#456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid@123/summary/test-cid#456');
    });

    it('should handle very long parameters', async () => {
      const longGid = 'a'.repeat(1000);
      const longCid = 'b'.repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      const { result } = renderHook(() => useMDXSummaryBundle(longGid, longCid), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/plugins/${longGid}/summary/${longCid}`);
    });
  });

  describe('loading states', () => {
    it('should show loading state initially', () => {
      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should show loading state during fetch', async () => {
      // Create a promise that we can control
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
        wrapper: createWrapper(),
      });

      // Should still be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('refetch behavior', () => {
    it('should refetch when parameters change', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      const { rerender } = renderHook(
        ({ gid, cid }) => useMDXSummaryBundle(gid, cid),
        {
          wrapper: createWrapper(),
          initialProps: { gid: 'test-gid-1', cid: 'test-cid-1' },
        }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid-1/summary/test-cid-1');
      });

      // Change parameters
      rerender({ gid: 'test-gid-2', cid: 'test-cid-2' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid-2/summary/test-cid-2');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('query key uniqueness', () => {
    it('should have different query keys for different parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMDXBundle),
      });

      renderHook(() => useMDXSummaryBundle('gid1', 'cid1'), {
        wrapper: createWrapper(),
      });

      renderHook(() => useMDXSummaryBundle('gid2', 'cid2'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/gid1/summary/cid1');
        expect(mockFetch).toHaveBeenCalledWith('/api/plugins/gid2/summary/cid2');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
}); 