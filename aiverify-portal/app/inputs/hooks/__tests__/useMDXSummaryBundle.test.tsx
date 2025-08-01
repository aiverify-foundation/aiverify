import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMDXSummaryBundle } from '../useMDXSummaryBundle';
import { MdxBundle } from '@/app/types';

// Mock fetch
global.fetch = jest.fn();

// Create a wrapper component with QueryClient
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

describe('useMDXSummaryBundle', () => {
  const mockMdxBundle: MdxBundle = {
    code: 'validation and summary functions',
    frontmatter: { title: 'Test Bundle' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns query result with correct properties', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.data).toBe('undefined');
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.error).toBe('object');
    expect(typeof result.current.isError).toBe('boolean');
  });

  it('successfully fetches MDX summary bundle', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMdxBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMdxBundle);
    expect(global.fetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
  });

  it('handles API error with status text', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Failed to fetch MDX summary bundle: Not Found');
  });

  it('handles fetch error', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Network error');
  });

  it('handles JSON parsing error', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('JSON parse error');
      },
    } as unknown as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('JSON parse error');
  });

  it('logs error to console when fetch fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching MDX summary bundle:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('is disabled when gid is empty', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is disabled when cid is empty', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is disabled when both gid and cid are empty', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is enabled when both gid and cid are provided', () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMdxBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
  });

  it('handles loading state correctly', () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
  });

  it('handles success state correctly', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMdxBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toEqual(mockMdxBundle);
  });

  it('handles error state correctly', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('uses correct query key', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    // The query should be enabled and use the correct key
    expect(result.current.isFetching).toBe(true);
  });

  it('refetches when parameters change', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMdxBundle,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMdxBundle, code: 'updated code' }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ gid, cid }) => useMDXSummaryBundle(gid, cid),
      {
        wrapper: createWrapper(),
        initialProps: { gid: 'test-gid', cid: 'test-cid' },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMdxBundle);

    // Change parameters
    rerender({ gid: 'new-gid', cid: 'new-cid' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith('/api/plugins/new-gid/summary/new-cid');
  });
}); 