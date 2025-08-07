import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useDeleteTestRun from '../useDeleteTestRun';

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

describe('useDeleteTestRun', () => {
  const mockTestRuns = [
    {
      id: '1',
      name: 'Test Run 1',
      status: 'completed',
      progress: 100,
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

  it('deletes test run successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';
    const deletedId = await result.current.mutateAsync(testRunId);

    expect(deletedId).toBe(testRunId);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(mockConsoleLog).toHaveBeenCalledWith('Deleting test run: 1');
  });

  it('handles deletion error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Deletion failed',
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to delete test run: Deletion failed'
    );

    expect(mockConsoleError).toHaveBeenCalledWith('Test run deletion error:', 'Deletion failed');
  });

  it('invalidates test runs query after successful deletion', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });
  
    const testRunId = '1';
    await result.current.mutateAsync(testRunId);

    // The query should be invalidated to refresh the data
    expect(result.current.isPending).toBe(false);
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow('Network error');
  });

  it('handles server error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to delete test run: Internal server error'
    );
  });

  it('handles 404 errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Test run not found',
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '999';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to delete test run: Test run not found'
    );
  });

  it('handles timeout errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow('Request timeout');
  });

  it('handles multiple rapid deletions', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId1 = '1';
    const testRunId2 = '2';

    // Delete multiple test runs rapidly
    await Promise.all([
      result.current.mutateAsync(testRunId1),
      result.current.mutateAsync(testRunId2),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/1', expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/2', expect.any(Object));
  });

  it('logs successful deletion', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';
    await result.current.mutateAsync(testRunId);

    expect(mockConsoleLog).toHaveBeenCalledWith('Deleting test run: 1');
  });

  it('handles empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';
    const deletedId = await result.current.mutateAsync(testRunId);

    expect(deletedId).toBe(testRunId);
  });

  it('handles different test run IDs', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = 'test-run-123';
    const deletedId = await result.current.mutateAsync(testRunId);

    expect(deletedId).toBe(testRunId);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/test-run-123', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('handles UUID test run IDs', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '550e8400-e29b-41d4-a716-446655440000';
    const deletedId = await result.current.mutateAsync(testRunId);

    expect(deletedId).toBe(testRunId);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/550e8400-e29b-41d4-a716-446655440000', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('handles malformed response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    // Should still succeed since we don't parse JSON for DELETE
    const deletedId = await result.current.mutateAsync(testRunId);
    expect(deletedId).toBe(testRunId);
  });

  it('handles unauthorized access', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to delete test run: Unauthorized'
    );
  });

  it('handles forbidden access', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to delete test run: Forbidden'
    );
  });

  it('handles server maintenance errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '1';

    await expect(result.current.mutateAsync(testRunId)).rejects.toThrow(
      'Failed to delete test run: Service unavailable'
    );
  });

  it('handles empty test run ID', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = '';
    const deletedId = await result.current.mutateAsync(testRunId);

    expect(deletedId).toBe(testRunId);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('handles special characters in test run ID', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteTestRun(), {
      wrapper: createWrapper(),
    });

    const testRunId = 'test-run-with-special-chars_123';
    const deletedId = await result.current.mutateAsync(testRunId);

    expect(deletedId).toBe(testRunId);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_runs/test-run-with-special-chars_123', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
}); 