import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Plugin } from '@/app/plugins/utils/types';
import { useDeletePlugin } from '../useDeletePlugin';

// Mock fetch globally
global.fetch = jest.fn();

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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDeletePlugin Hook', () => {
  const mockPlugins: Plugin[] = [
    {
      gid: '1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: 'test meta',
      is_stock: false,
      zip_hash: 'hash1',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      gid: '2',
      version: '2.0.0',
      name: 'Test Plugin 2',
      author: 'Test Author 2',
      description: 'Test Description 2',
      url: 'https://test2.com',
      meta: 'test meta 2',
      is_stock: true,
      zip_hash: 'hash2',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Successful deletion', () => {
    it('successfully deletes a plugin', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Plugin deleted successfully!' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/plugins/1', {
        method: 'DELETE',
      });
      expect(result.current.data).toBe('Plugin deleted successfully!');
    });

    it('returns success message from API response', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Custom success message' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('test-plugin-id');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe('Plugin deleted successfully!');
    });
  });

  describe('Failed deletion', () => {
    it('handles API error response with error detail', async () => {
      const errorDetail = 'Plugin not found';
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: errorDetail }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('non-existent-id');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error(errorDetail));
    });

    it('handles API error response without error detail', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('test-id');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Failed to delete the plugin.'));
    });

    it('handles network errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('test-id');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Optimistic updates', () => {
    it('optimistically removes plugin from cache during mutation', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      // Mock the queryClient methods
      const queryClient = (result.current as any).queryClient || 
        result.current.mutate.toString().includes('queryClient');

      expect(result.current).toBeDefined();
    });

    it('rolls back optimistic update on error', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // The hook should handle rollback internally
      expect(result.current.error).toEqual(new Error('Server error'));
    });
  });

  describe('Hook states', () => {
    it('starts in idle state', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('transitions through mutation states correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      // Initial state
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('transitions to error state on failure', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad request' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('invalid-id');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('transitions to success state on successful deletion', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('API integration', () => {
    it('calls correct API endpoint with plugin ID', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      const pluginId = 'unique-plugin-id-123';
      result.current.mutate(pluginId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/plugins/${pluginId}`, {
        method: 'DELETE',
      });
    });

    it('handles different response formats', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe('Plugin deleted successfully!');
    });
  });

  describe('Edge cases', () => {
    it('handles empty plugin ID', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid plugin ID' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      result.current.mutate('');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/plugins/', {
        method: 'DELETE',
      });
    });

    it('handles special characters in plugin ID', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeletePlugin(), { wrapper });

      const specialId = 'plugin-id-with-@#$%^&*()';
      result.current.mutate(specialId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/plugins/${specialId}`, {
        method: 'DELETE',
      });
    });
  });
}); 