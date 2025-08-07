import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMDXBundle } from '../useMDXBundle';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper component for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useMDXBundle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch MDX bundle successfully', async () => {
    const mockBundle = {
      code: 'export default function Test() { return <div>Test</div>; }',
      frontmatter: { title: 'Test Bundle' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as unknown as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/bundle/test-cid');
    expect(result.current.data).toEqual(mockBundle);
  });

  it('should be disabled when gid is empty', () => {
    const { result } = renderHook(() => useMDXBundle('', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should be disabled when cid is empty', () => {
    const { result } = renderHook(() => useMDXBundle('test-gid', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should be disabled when both gid and cid are empty', () => {
    const { result } = renderHook(() => useMDXBundle('', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should be enabled when both gid and cid are provided', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ code: '', frontmatter: {} }),
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/bundle/test-cid');
  });

  it('should handle MDX bundle with empty frontmatter', async () => {
    const mockBundle = {
      code: 'export default function Test() { return <div>Test</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as unknown as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBundle);
  });

  it('should handle MDX bundle with complex frontmatter', async () => {
    const mockBundle = {
      code: 'export default function Test() { return <div>Test</div>; }',
      frontmatter: {
        title: 'Complex Bundle',
        description: 'A complex MDX bundle',
        metadata: {
          author: 'Test Author',
          version: '1.0.0',
          tags: ['test', 'mdx'],
        },
        config: {
          theme: 'dark',
          layout: 'default',
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as unknown as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBundle);
  });

  it('should handle 404 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle 500 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle 403 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle 401 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });

  it('should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Invalid JSON');
  });

  it('should handle empty response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => null,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle undefined gid and cid', () => {
    const { result } = renderHook(() => useMDXBundle(undefined, undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should handle null gid and cid', () => {
    const { result } = renderHook(() => useMDXBundle(null as any, null as any), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should handle special characters in gid and cid', async () => {
    const mockBundle = {
      code: 'export default function Test() { return <div>Test</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as unknown as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid@#$%', 'test-cid!@#'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid@#$%/bundle/test-cid!@#');
  });

  it('should handle spaces in gid and cid', async () => {
    const { result } = renderHook(() => useMDXBundle('test gid', 'test cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test gid/bundle/test cid');
  });

  it('should handle very long gid and cid', async () => {
    const longGid = 'a'.repeat(1000);
    const longCid = 'b'.repeat(1000);
    const mockBundle = {
      code: 'export default function Test() { return <div>Test</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as unknown as Response);

    const { result } = renderHook(() => useMDXBundle(longGid, longCid), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(`/api/plugins/${longGid}/bundle/${longCid}`);
  });

  it('should handle loading state', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(true);
    expect(result.current.isLoading).toBe(true);

    resolvePromise!({
      ok: true,
      status: 200,
      json: async () => ({ code: '', frontmatter: {} }),
    } as unknown as Response);

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });
  });

  it('should handle refetch functionality', async () => {
    const mockBundle = {
      code: 'export default function Test() { return <div>Test</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Refetch
    await result.current.refetch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
}); 