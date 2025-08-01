import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMDXBundle } from '../useMDXBundle';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper component for testing
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
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMDXBundle', () => {
  const mockMDXBundle = {
    code: 'export default function TestComponent() { return <div>Test</div>; }',
    frontmatter: {
      title: 'Test Component',
      description: 'A test component',
      tags: ['test', 'component'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch MDX bundle successfully when both gid and cid are provided', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMDXBundle,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/bundle/test-cid');
    
    // Verify data is correct
    expect(result.current.data).toEqual(mockMDXBundle);
  });

  it('should not fetch when gid is undefined', () => {
    const { result } = renderHook(() => useMDXBundle(undefined, 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when cid is undefined', () => {
    const { result } = renderHook(() => useMDXBundle('test-gid', undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when both gid and cid are undefined', () => {
    const { result } = renderHook(() => useMDXBundle(undefined, undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when gid is empty string', () => {
    const { result } = renderHook(() => useMDXBundle('', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when cid is empty string', () => {
    const { result } = renderHook(() => useMDXBundle('test-gid', ''), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle fetch error when response is not ok', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/bundle/test-cid');
    
    // Verify error message
    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle network error', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/bundle/test-cid');
    
    // Verify error message
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should handle JSON parsing error', async () => {
    // Mock response with invalid JSON
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/bundle/test-cid');
    
    // Verify error message
    expect(result.current.error?.message).toBe('Invalid JSON');
  });

  it('should handle different gid and cid values', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockMDXBundle, frontmatter: { title: 'Different Component' } }),
    } as Response);

    const { result } = renderHook(() => useMDXBundle('different-gid', 'different-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/different-gid/bundle/different-cid');
    
    // Verify data is correct
    expect(result.current.data?.frontmatter.title).toBe('Different Component');
  });

  it('should handle special characters in gid and cid', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMDXBundle,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid!@#', 'test-cid!@#'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify fetch was called with special characters
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid!@#/bundle/test-cid!@#');
  });

  it('should handle 500 server error', async () => {
    // Mock 500 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle 403 forbidden error', async () => {
    // Mock 403 error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error?.message).toBe('Failed to fetch MDX bundle');
  });

  it('should handle loading state', () => {
    // Mock delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => mockMDXBundle,
          } as Response);
        }, 100);
      })
    );

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should handle query key correctly', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMDXBundle,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the query key is set correctly
    expect(result.current.data).toEqual(mockMDXBundle);
  });

  it('should handle MDX bundle with empty code', async () => {
    const emptyMDXBundle = {
      code: '',
      frontmatter: {},
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyMDXBundle,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify data is correct
    expect(result.current.data).toEqual(emptyMDXBundle);
  });

  it('should handle MDX bundle with complex frontmatter', async () => {
    const complexMDXBundle = {
      code: 'export default function ComplexComponent() { return <div>Complex</div>; }',
      frontmatter: {
        title: 'Complex Component',
        description: 'A complex component with many properties',
        tags: ['complex', 'component', 'advanced'],
        metadata: {
          version: '1.0.0',
          author: 'Test Author',
          dependencies: ['react', 'typescript'],
        },
        config: {
          theme: 'dark',
          layout: 'sidebar',
          features: ['search', 'navigation', 'analytics'],
        },
      },
    };

    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => complexMDXBundle,
    } as Response);

    const { result } = renderHook(() => useMDXBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify data is correct
    expect(result.current.data).toEqual(complexMDXBundle);
    expect((result.current.data?.frontmatter as any).metadata.version).toBe('1.0.0');
    expect((result.current.data?.frontmatter as any).config.features).toContain('search');
  });

  it('should handle null gid and cid', () => {
    const { result } = renderHook(() => useMDXBundle(null as any, null as any), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle undefined gid and defined cid', () => {
    const { result } = renderHook(() => useMDXBundle(undefined, 'test-cid'), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle defined gid and undefined cid', () => {
    const { result } = renderHook(() => useMDXBundle('test-gid', undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });
}); 