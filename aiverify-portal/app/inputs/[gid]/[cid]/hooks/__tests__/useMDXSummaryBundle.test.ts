import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMDXSummaryBundle } from '../useMDXSummaryBundle';
import { MdxBundle } from '@/app/types';
import React from 'react';

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
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useMDXSummaryBundle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch MDX summary bundle successfully', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: { title: 'Summary Bundle', description: 'Test summary' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
    expect(result.current.data).toEqual(mockBundle);
  });

  it('should be disabled when gid is empty', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should be disabled when cid is empty', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should be disabled when both gid and cid are empty', () => {
    const { result } = renderHook(() => useMDXSummaryBundle('', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should be enabled when both gid and cid are provided', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ code: '', frontmatter: {} }),
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
  });

  it('should handle MDX summary bundle with empty frontmatter', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBundle);
  });

  it('should handle MDX summary bundle with undefined frontmatter', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: undefined,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBundle);
  });

  it('should handle MDX summary bundle with complex frontmatter', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {
        title: 'Complex Summary Bundle',
        description: 'A complex MDX summary bundle',
        metadata: {
          author: 'Test Author',
          version: '1.0.0',
          tags: ['test', 'mdx', 'summary'],
        },
        config: {
          theme: 'dark',
          layout: 'summary',
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
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

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX summary bundle: Not Found');
  });

  it('should handle 500 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX summary bundle: Internal Server Error');
  });

  it('should handle 403 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX summary bundle: Forbidden');
  });

  it('should handle 401 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch MDX summary bundle: Unauthorized');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
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
    } as unknown as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
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

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle undefined gid and cid', () => {
    const { result } = renderHook(() => useMDXSummaryBundle(undefined as any, undefined as any), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle null gid and cid', () => {
    const { result } = renderHook(() => useMDXSummaryBundle(null as any, null as any), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle special characters in gid and cid', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid@#$%', 'test-cid!@#'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid@#$%/summary/test-cid!@#');
  });

  it('should handle spaces in gid and cid', async () => {
    const { result } = renderHook(() => useMDXSummaryBundle('test gid', 'test cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test gid/summary/test cid');
  });

  it('should handle very long gid and cid', async () => {
    const longGid = 'a'.repeat(1000);
    const longCid = 'b'.repeat(1000);
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle(longGid, longCid), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(`/api/plugins/${longGid}/summary/${longCid}`);
  });

  it('should handle loading state', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(true);
    expect(result.current.isLoading).toBe(true);

    resolvePromise!({
      ok: true,
      status: 200,
      json: async () => ({ code: '', frontmatter: {} }),
    } as Response);

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });
  });

  it('should handle refetch functionality', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Refetch
    await result.current.refetch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle query key correctly', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBundle);
  });

  it('should handle different gid and cid combinations', async () => {
    const mockBundle: MdxBundle = {
      code: 'export default function Summary() { return <div>Summary Component</div>; }',
      frontmatter: {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result: result1 } = renderHook(() => useMDXSummaryBundle('gid1', 'cid1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    const { result: result2 } = renderHook(() => useMDXSummaryBundle('gid2', 'cid2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/gid1/summary/cid1');
    expect(mockFetch).toHaveBeenCalledWith('/api/plugins/gid2/summary/cid2');
  });

  it('should handle MDX bundle with complex code', async () => {
    const complexCode = `
      import React from 'react';
      import { useState, useEffect } from 'react';
      
      export default function ComplexSummary() {
        const [data, setData] = useState(null);
        
        useEffect(() => {
          // Complex logic here
          setData({ summary: 'Complex summary data' });
        }, []);
        
        return (
          <div className="summary-container">
            <h1>Complex Summary</h1>
            <p>{data?.summary}</p>
          </div>
        );
      }
    `;

    const mockBundle: MdxBundle = {
      code: complexCode,
      frontmatter: {
        title: 'Complex Summary',
        description: 'A summary with complex React code',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBundle,
    } as Response);

    const { result } = renderHook(() => useMDXSummaryBundle('test-gid', 'test-cid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.code).toBe(complexCode);
    expect(result.current.data?.frontmatter?.title).toBe('Complex Summary');
  });
}); 