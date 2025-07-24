import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useGetTestRuns from '../useGetTestRuns';

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Wrapper component for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGetTestRuns', () => {
  const mockTestRuns = [
    {
      id: '1',
      name: 'Test Run 1',
      status: 'pending',
      progress: 50,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Test Run 2',
      status: 'completed',
      progress: 100,
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('fetches test runs successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTestRuns,
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTestRuns);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
      next: { revalidate: 0 },
    });
  });

  it('handles fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Server error',
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Failed to fetch test runs: Server error'));
  });

  it('handles empty test runs array', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Network error'));
  });

  it('logs fetch operations', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTestRuns,
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockConsoleLog).toHaveBeenCalledWith('Fetching test runs');
    expect(mockConsoleLog).toHaveBeenCalledWith('Test runs fetch successful:', mockTestRuns);
  });

  it('logs error messages', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Server error',
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockConsoleError).toHaveBeenCalledWith('Test runs fetch error:', 'Server error');
  });

  it('handles malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Invalid JSON'));
  });

  it('handles large test runs array', async () => {
    const largeTestRuns = Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      name: `Test Run ${i}`,
      status: i % 2 === 0 ? 'pending' : 'completed',
      progress: i % 2 === 0 ? 50 : 100,
      created_at: '2023-01-01T00:00:00Z',
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => largeTestRuns,
    });

    const { result } = renderHook(() => useGetTestRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(largeTestRuns);
    expect(result.current.data).toHaveLength(100);
  });
}); 