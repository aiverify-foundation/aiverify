import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFairnessTreeEdit } from '../useEditFairnessTree';
import { FairnessTree, FairnessTreeData } from '@/app/inputs/utils/types';

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

const mockTree: FairnessTree = {
  gid: 'test-gid',
  cid: 'test-cid',
  name: 'Test Tree',
  group: 'test-group',
  data: {
    sensitiveFeature: 'age',
    favourableOutcomeName: 'approved',
    qualified: 'yes',
    unqualified: 'no',
    selectedOutcomes: ['outcome1', 'outcome2'],
    metrics: ['metric1', 'metric2'],
    selections: { nodes: ['node1'], edges: ['edge1'] },
    'ans-outcome1': 'Yes',
    'ans-outcome2': 'No',
  },
  id: 1,
};

const mockOnClose = jest.fn();

describe('useFairnessTreeEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with correct default values', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isEditing).toBe(false);
      expect(result.current.treeName).toBe('Test Tree');
      expect(result.current.hasChanges).toBe(false);
      expect(result.current.selectedOutcomes).toEqual(['outcome1', 'outcome2']);
      expect(result.current.metrics).toEqual(['metric1', 'metric2']);
      expect(result.current.treeData).toEqual(mockTree.data);
    });

    it('should initialize with empty data when tree has no data', async () => {
      const treeWithoutData: FairnessTree = {
        ...mockTree,
        data: undefined as any,
      };

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: treeWithoutData, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.treeData).toEqual({
        graphdata: { nodes: [], edges: [] },
        definitions: [],
        selectedOutcomes: [],
        metrics: [],
      });
      expect(result.current.selectedOutcomes).toEqual([]);
      expect(result.current.metrics).toEqual([]);
    });
  });

  describe('State management', () => {
    it('should toggle editing state', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isEditing).toBe(false);

      act(() => {
        result.current.setIsEditing(true);
      });

      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.setIsEditing(false);
      });

      expect(result.current.isEditing).toBe(false);
    });

    it('should update tree name', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.setTreeName('New Tree Name');
      });

      expect(result.current.treeName).toBe('New Tree Name');
    });

    it('should detect changes when tree name is modified', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.hasChanges).toBe(false);

      act(() => {
        result.current.setTreeName('Modified Tree Name');
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect changes when tree data is modified', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.hasChanges).toBe(false);

      act(() => {
        result.current.handleChangeData('sensitiveFeature', ['gender']);
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('Data change handling', () => {
    it('should handle selectedOutcomes changes correctly', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('selectedOutcomes', ['outcome3', 'outcome4']);
      });

      expect(result.current.selectedOutcomes).toEqual(['outcome3', 'outcome4']);
      expect(result.current.treeData.selectedOutcomes).toEqual(['outcome3', 'outcome4']);
    });

    it('should handle metrics changes correctly', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('metrics', ['metric3', 'metric4']);
      });

      expect(result.current.metrics).toEqual(['metric3', 'metric4']);
      expect(result.current.treeData.metrics).toEqual(['metric3', 'metric4']);
    });

    it('should handle other data changes correctly', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('sensitiveFeature', ['gender']);
      });

      expect(result.current.treeData.sensitiveFeature).toEqual(['gender']);
    });

    it('should clean up ans-* properties when selectedOutcomes change', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      // Initially has ans-* properties
      expect(result.current.treeData['ans-outcome1']).toBe('Yes');
      expect(result.current.treeData['ans-outcome2']).toBe('No');

      act(() => {
        result.current.handleChangeData('selectedOutcomes', ['outcome3']);
      });

      // ans-outcome1 and ans-outcome2 should be removed since they're not in the new selection
      expect(result.current.treeData['ans-outcome1']).toBeUndefined();
      expect(result.current.treeData['ans-outcome2']).toBeUndefined();
    });

    it('should preserve ans-* properties for remaining selected outcomes', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('selectedOutcomes', ['outcome1']);
      });

      // ans-outcome1 should be preserved since outcome1 is still selected
      expect(result.current.treeData['ans-outcome1']).toBe('Yes');
      // ans-outcome2 should be removed since outcome2 is no longer selected
      expect(result.current.treeData['ans-outcome2']).toBeUndefined();
    });
  });

  describe('Save changes', () => {
    it('should save changes successfully', async () => {
      const mockResponse = { success: true, message: 'Tree updated successfully' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.setTreeName('Updated Tree Name');
      });

      let saveResult;
      await act(async () => {
        saveResult = await result.current.handleSaveChanges();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Tree Name',
          group: 'Updated Tree Name',
          data: {
            ...mockTree.data,
            selectedOutcomes: ['outcome1', 'outcome2'],
            metrics: ['metric1', 'metric2'],
          },
        }),
      });

      expect(saveResult).toEqual({ success: true, message: 'Tree updated successfully' });
      expect(result.current.isEditing).toBe(false);
    });

    it('should handle save errors', async () => {
      const apiError = {
        detail: 'Validation error',
        status_code: 400,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => apiError,
      } as Response);

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      let saveResult;
      await act(async () => {
        saveResult = await result.current.handleSaveChanges();
      });

      expect(saveResult.success).toBe(false);
      expect(saveResult.message).toContain('Error updating tree');
      expect(result.current.isEditing).toBe(false);
    });

    it('should handle network errors during save', async () => {
      const networkError = new Error('Network error');

      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      let saveResult;
      await act(async () => {
        saveResult = await result.current.handleSaveChanges();
      });

      expect(saveResult.success).toBe(false);
      expect(saveResult.message).toContain('Error updating tree');
      expect(result.current.isEditing).toBe(false);
    });

    it('should handle JSON parsing errors during save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      let saveResult;
      await act(async () => {
        saveResult = await result.current.handleSaveChanges();
      });

      expect(saveResult.success).toBe(false);
      expect(saveResult.message).toContain('Error updating tree');
      expect(result.current.isEditing).toBe(false);
    });

    it('should include all updated data in save request', async () => {
      const mockResponse = { success: true, message: 'Tree updated successfully' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.setTreeName('New Name');
        result.current.handleChangeData('selectedOutcomes', ['outcome3']);
        result.current.handleChangeData('metrics', ['metric3']);
        result.current.handleChangeData('sensitiveFeature', ['gender']);
      });

      await act(async () => {
        await result.current.handleSaveChanges();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"name":"New Name"'),
      });

      // Verify the body contains all the expected data
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs?.[1]).toBeDefined();
      const body = JSON.parse((callArgs![1] as any).body as string);
      
      expect(body.name).toBe('New Name');
      expect(body.group).toBe('New Name');
      expect(body.data.sensitiveFeature).toEqual(['gender']);
      expect(body.data.selectedOutcomes).toEqual(['outcome3']);
      expect(body.data.metrics).toEqual(['metric3']);
      expect(body.data.favourableOutcomeName).toBe('approved');
      expect(body.data.qualified).toBe('yes');
      expect(body.data.unqualified).toBe('no');
      expect(body.data.selections).toEqual({ nodes: ['node1'], edges: ['edge1'] });
    });
  });

  describe('Change detection', () => {
    it('should detect changes when tree name differs from original', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.setTreeName('Different Name');
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect changes when tree data differs from original', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('sensitiveFeature', ['gender']);
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should not detect changes when data is reverted to original', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.setTreeName('Different Name');
      });

      expect(result.current.hasChanges).toBe(true);

      act(() => {
        result.current.setTreeName('Test Tree');
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it('should detect changes when selectedOutcomes differ from original', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('selectedOutcomes', ['outcome3']);
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect changes when metrics differ from original', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('metrics', ['metric3']);
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('Mutation state', () => {
    it('should provide mutation state', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.mutation).toBeDefined();
      expect(result.current.mutation.isPending).toBeDefined();
      expect(result.current.mutation.isError).toBeDefined();
      expect(result.current.mutation.isSuccess).toBeDefined();
    });

    it('should handle mutation loading state', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as any);

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      let savePromise;
      await act(async () => {
        savePromise = result.current.handleSaveChanges();
      });

      // The mutation state is not immediately available, so we need to wait
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.mutation.isPending).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);

        await savePromise;

        // Wait for the mutation state to update
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.mutation.isPending).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle tree with minimal data', async () => {
      const minimalTree: FairnessTree = {
        gid: 'test-gid',
        cid: 'test-cid',
        name: 'Minimal Tree',
        group: 'test-group',
        data: {
          sensitiveFeature: 'age',
          favourableOutcomeName: 'approved',
          qualified: 'yes',
          unqualified: 'no',
          selectedOutcomes: [],
          metrics: [],
          selections: { nodes: [], edges: [] },
        },
        id: 1,
      };

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: minimalTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.treeData).toEqual(minimalTree.data);
      expect(result.current.selectedOutcomes).toEqual([]);
      expect(result.current.metrics).toEqual([]);
    });

    it('should handle tree with complex data structure', async () => {
      const complexTree: FairnessTree = {
        ...mockTree,
        data: {
          ...mockTree.data,
          'custom-field-1': 'custom-value-1',
          'custom-field-2': ['value1', 'value2'],
          'nested-object': {
            key1: 'value1',
            key2: 'value2',
          },
        } as any, // Use any to allow additional properties for testing
      };

      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: complexTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      expect(result.current.treeData['custom-field-1']).toBe('custom-value-1');
      expect(result.current.treeData['custom-field-2']).toEqual(['value1', 'value2']);
      expect(result.current.treeData['nested-object']).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should handle empty string values', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('sensitiveFeature', ['']);
      });

      expect(result.current.treeData.sensitiveFeature).toEqual(['']);
    });

    it('should handle null and undefined values', async () => {
      const { result } = renderHook(
        () => useFairnessTreeEdit({ tree: mockTree, onClose: mockOnClose }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleChangeData('sensitiveFeature', [null as any]);
      });

      expect(result.current.treeData.sensitiveFeature).toEqual([null]);
    });
  });
}); 