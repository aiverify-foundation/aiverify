import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInputBlockGroupSubmission } from '../useUploadSubmission';

// Mock fetch globally
(global.fetch as any) = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Helper function to create mock Response
const createMockResponse = (ok: boolean, data: any, status = 200) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data) as any,
} as unknown as Response);

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Create a wrapper component with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useInputBlockGroupSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful submission', () => {
    it('should submit input block group successfully', async () => {
      const mockResponse = createMockResponse(true, { success: true });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [
          {
            cid: 'test-block-1',
            data: { test: 'data' },
          },
        ],
      };

      await result.current.submitInputBlockGroup(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('should log the final payload', async () => {
      const mockResponse = createMockResponse(true, { success: true });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [
          {
            cid: 'test-block-1',
            data: { test: 'data' },
          },
        ],
      };

      await result.current.submitInputBlockGroup(payload);

      expect(console.log).toHaveBeenCalledWith('Final payload:', JSON.stringify(payload, null, 2));
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [{ cid: 'test', data: {} }],
      };

      await expect(result.current.submitInputBlockGroup(payload)).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      const mockJson = jest.fn();
      mockJson.mockRejectedValue(new Error('JSON parse error'));
      const errorResponse = {
        ok: false,
        status: 500,
        json: mockJson,
      } as unknown as Response;
      mockFetch.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [{ cid: 'test', data: {} }],
      };

      await expect(result.current.submitInputBlockGroup(payload)).rejects.toThrow('JSON parse error');
    });
  });

  describe('mutation state', () => {
    it('should track error state after failed submission', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [{ cid: 'test', data: {} }],
      };

      // Initially no error
      expect(result.current.error).toBe(null);

      // Submit and expect failure
      await expect(result.current.submitInputBlockGroup(payload)).rejects.toThrow('Network error');
      
      // Should have error state
      expect(result.current.error).toBeDefined();
    });

    it('should provide submitInputBlockGroup function', () => {
      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.submitInputBlockGroup).toBe('function');
    });

    it('should provide isSubmitting state', () => {
      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.isSubmitting).toBe('boolean');
    });

    it('should provide error state', () => {
      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should handle empty input blocks array', async () => {
      const mockResponse = createMockResponse(true, { success: true });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [],
      };

      await result.current.submitInputBlockGroup(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('should handle complex data structures in input blocks', async () => {
      const mockResponse = createMockResponse(true, { success: true });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [
          {
            cid: 'complex-block',
            data: {
              nested: {
                array: [1, 2, 3],
                object: { key: 'value' },
                null: null,
                undefined: undefined,
              },
            },
          },
        ],
      };

      await result.current.submitInputBlockGroup(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('should handle multiple input blocks', async () => {
      const mockResponse = createMockResponse(true, { success: true });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInputBlockGroupSubmission(), {
        wrapper: createWrapper(),
      });

      const payload = {
        gid: 'test.gid',
        name: 'Test Group',
        group: 'test_group',
        input_blocks: [
          { cid: 'block-1', data: { test1: 'data1' } as Record<string, string> },
          { cid: 'block-2', data: { test2: 'data2' } as Record<string, string> },
          { cid: 'block-3', data: { test3: 'data3' } as Record<string, string> },
        ],
      };

      await result.current.submitInputBlockGroup(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });
  });
}); 