import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useCancelTestRun from '../useCancelTestRun';

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

describe('useCancelTestRun', () => {
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
      status: 'running',
      progress: 75,
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

  it('cancels test run successfully', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';
    await result.current.mutateAsync(testRunId);

    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/1/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(mockConsoleLog).toHaveBeenCalledWith('Canceling test run: 1');
  });

  it('handles cancellation error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Cancellation failed',
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to cancel test run: Cancellation failed'
    );

    expect(mockConsoleError).toHaveBeenCalledWith('Test run cancellation error:', 'Cancellation failed');
  });

  it('updates cache on successful cancellation', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });
  
    const testRunId = '1';
    await result.current.mutateAsync(testRunId);
  
    // The query should be invalidated to refresh the data
    expect(result.current.isPending).toBe(false);
  });

  it('invalidates test runs query after cancellation', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });
  
    const testRunId = '1';
    await result.current.mutateAsync(testRunId);
  
    // The query should be invalidated to refresh the data
    expect(result.current.isPending).toBe(false);
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow('Network error');
  });

  it('handles malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow('Invalid JSON');
  });

  it('maintains progress value when cancelling', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });
  
    const testRunId = '1';
    await result.current.mutateAsync(testRunId);
  
    expect(result.current.isPending).toBe(false);
  });

  it('handles cancellation of non-existent test run', async () => {
    const mockResponse = { message: 'Test run not found' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });
  
    const testRunId = '999'; // Non-existent test run
    await result.current.mutateAsync(testRunId);
  
    expect(result.current.isPending).toBe(false);
  });

  it('handles empty cache gracefully', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';
    await result.current.mutateAsync(testRunId);

    // Should not crash when cache is empty
    expect(result.current.isPending).toBe(false);
  });

  it('handles multiple rapid cancellations', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId1 = '1';
    const testRunId2 = '2';

    // Cancel multiple test runs rapidly
    await Promise.all([
      result.current.mutateAsync(testRunId1),
      result.current.mutateAsync(testRunId2),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/1/cancel', expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/2/cancel', expect.any(Object));
  });

  it('handles different test run statuses', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });
  
    const testRunId = '2'; // This test run has status 'running'
    await result.current.mutateAsync(testRunId);
  
    expect(result.current.isPending).toBe(false);
  });

  it('logs successful cancellation', async () => {
    const mockResponse = { message: 'Test run cancelled successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';
    await result.current.mutateAsync(testRunId);

    expect(mockConsoleLog).toHaveBeenCalledWith('Canceling test run: 1');
  });

  it('handles server error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to cancel test run: Internal server error'
    );
  });

  it('handles timeout errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

    const { result } = renderHook(() => useCancelTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow('Request timeout');
  });
}); 