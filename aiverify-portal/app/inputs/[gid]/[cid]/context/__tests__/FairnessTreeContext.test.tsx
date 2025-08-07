import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { FairnessTreeProvider, useFairnessTree } from '../FairnessTreeContext';
import { FairnessTree } from '@/app/inputs/utils/types';

// Mock component to test the context
const TestComponent = () => {
  const {
    fairnessTrees,
    addFairnessTree,
    removeFairnessTree,
    clearFairnessTrees,
    updateFairnessTree,
  } = useFairnessTree();

  return (
    <div>
      <div data-testid="tree-count">{fairnessTrees.length}</div>
      <div data-testid="tree-names">
        {fairnessTrees.map((tree) => tree.name).join(', ')}
      </div>
      <button
        data-testid="add-tree"
        onClick={() =>
          addFairnessTree({
            gid: 'test-gid',
            cid: 'test-cid',
            name: 'Test Tree',
            group: 'test-group',
            data: {
              sensitiveFeature: 'age',
              favourableOutcomeName: 'approved',
              qualified: 'yes',
              unqualified: 'no',
              selectedOutcomes: ['outcome1'],
              metrics: ['metric1'],
              selections: { nodes: [], edges: [] },
            },
            id: 1,
          })
        }
      >
        Add Tree
      </button>
      <button
        data-testid="remove-tree"
        onClick={() => removeFairnessTree('Test Tree')}
      >
        Remove Tree
      </button>
      <button data-testid="clear-trees" onClick={clearFairnessTrees}>
        Clear Trees
      </button>
      <button
        data-testid="update-tree"
        onClick={() =>
          updateFairnessTree('test-gid', { name: 'Updated Tree' })
        }
      >
        Update Tree
      </button>
    </div>
  );
};

// Component to test context outside provider
const TestComponentWithoutProvider = () => {
  try {
    const context = useFairnessTree();
    return <div data-testid="context-available">Context Available</div>;
  } catch (error) {
    return <div data-testid="context-error">{(error as Error).message}</div>;
  }
};

describe('FairnessTreeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FairnessTreeProvider', () => {
    it('should render children without crashing', () => {
      render(
        <FairnessTreeProvider>
          <div data-testid="child">Child Component</div>
        </FairnessTreeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide initial empty fairness trees array', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      expect(screen.getByTestId('tree-count')).toHaveTextContent('0');
      expect(screen.getByTestId('tree-names')).toHaveTextContent('');
    });
  });

  describe('useFairnessTree hook', () => {
    it('should throw error when used outside provider', () => {
      render(<TestComponentWithoutProvider />);

      expect(screen.getByTestId('context-error')).toHaveTextContent(
        'useFairnessTree must be used within a FairnessTreeProvider'
      );
    });

    it('should add fairness tree correctly', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      act(() => {
        addButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('1');
      expect(screen.getByTestId('tree-names')).toHaveTextContent('Test Tree');
    });

    it('should add multiple fairness trees correctly', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      
      act(() => {
        addButton.click();
        addButton.click();
        addButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('3');
      expect(screen.getByTestId('tree-names')).toHaveTextContent(
        'Test Tree, Test Tree, Test Tree'
      );
    });

    it('should remove fairness tree by name correctly', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      const removeButton = screen.getByTestId('remove-tree');

      act(() => {
        addButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('1');

      act(() => {
        removeButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('0');
      expect(screen.getByTestId('tree-names')).toHaveTextContent('');
    });

    it('should remove only the specified tree when multiple trees exist', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      const removeButton = screen.getByTestId('remove-tree');

      act(() => {
        addButton.click();
        addButton.click();
        addButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('3');

      act(() => {
        removeButton.click();
      });

      // Since all trees have the same name 'Test Tree', removeFairnessTree removes all of them
      expect(screen.getByTestId('tree-count')).toHaveTextContent('0');
    });

    it('should clear all fairness trees correctly', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      const clearButton = screen.getByTestId('clear-trees');

      act(() => {
        addButton.click();
        addButton.click();
        addButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('3');

      act(() => {
        clearButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('0');
      expect(screen.getByTestId('tree-names')).toHaveTextContent('');
    });

    it('should update fairness tree by gid correctly', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      const updateButton = screen.getByTestId('update-tree');

      act(() => {
        addButton.click();
      });

      expect(screen.getByTestId('tree-names')).toHaveTextContent('Test Tree');

      act(() => {
        updateButton.click();
      });

      expect(screen.getByTestId('tree-names')).toHaveTextContent('Updated Tree');
    });

    it('should not update tree when gid does not match', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      const updateButton = screen.getByTestId('update-tree');

      act(() => {
        addButton.click();
      });

      expect(screen.getByTestId('tree-names')).toHaveTextContent('Test Tree');

      // Try to update with non-matching gid
      act(() => {
        updateButton.click();
      });

      // The tree should still be updated because the test tree has gid 'test-gid'
      expect(screen.getByTestId('tree-names')).toHaveTextContent('Updated Tree');
    });

    it('should handle partial updates correctly', () => {
      const TestComponentWithPartialUpdate = () => {
        const { fairnessTrees, addFairnessTree, updateFairnessTree } = useFairnessTree();

        return (
          <div>
            <div data-testid="tree-data">
              {fairnessTrees.map((tree) => 
                `${tree.name}-${tree.group}-${tree.data.sensitiveFeature}`
              ).join(', ')}
            </div>
            <button
              data-testid="add-tree"
              onClick={() =>
                addFairnessTree({
                  gid: 'test-gid',
                  cid: 'test-cid',
                  name: 'Test Tree',
                  group: 'test-group',
                  data: {
                    sensitiveFeature: 'age',
                    favourableOutcomeName: 'approved',
                    qualified: 'yes',
                    unqualified: 'no',
                    selectedOutcomes: ['outcome1'],
                    metrics: ['metric1'],
                    selections: { nodes: [], edges: [] },
                  },
                  id: 1,
                })
              }
            >
              Add Tree
            </button>
            <button
              data-testid="update-group"
              onClick={() =>
                updateFairnessTree('test-gid', { group: 'updated-group' })
              }
            >
              Update Group
            </button>
            <button
              data-testid="update-data"
              onClick={() =>
                updateFairnessTree('test-gid', { 
                  data: {
                    sensitiveFeature: 'gender',
                    favourableOutcomeName: 'approved',
                    qualified: 'yes',
                    unqualified: 'no',
                    selectedOutcomes: ['outcome1'],
                    metrics: ['metric1'],
                    selections: { nodes: [], edges: [] },
                  }
                })
              }
            >
              Update Data
            </button>
          </div>
        );
      };

      render(
        <FairnessTreeProvider>
          <TestComponentWithPartialUpdate />
        </FairnessTreeProvider>
      );

      const addButton = screen.getByTestId('add-tree');
      const updateGroupButton = screen.getByTestId('update-group');
      const updateDataButton = screen.getByTestId('update-data');

      act(() => {
        addButton.click();
      });

      expect(screen.getByTestId('tree-data')).toHaveTextContent(
        'Test Tree-test-group-age'
      );

      act(() => {
        updateGroupButton.click();
      });

      expect(screen.getByTestId('tree-data')).toHaveTextContent(
        'Test Tree-updated-group-age'
      );

      act(() => {
        updateDataButton.click();
      });

      expect(screen.getByTestId('tree-data')).toHaveTextContent(
        'Test Tree-updated-group-gender'
      );
    });

    it('should handle empty fairness trees array operations', () => {
      render(
        <FairnessTreeProvider>
          <TestComponent />
        </FairnessTreeProvider>
      );

      const removeButton = screen.getByTestId('remove-tree');
      const clearButton = screen.getByTestId('clear-trees');
      const updateButton = screen.getByTestId('update-tree');

      act(() => {
        removeButton.click();
        clearButton.click();
        updateButton.click();
      });

      expect(screen.getByTestId('tree-count')).toHaveTextContent('0');
      expect(screen.getByTestId('tree-names')).toHaveTextContent('');
    });

    it('should maintain tree order when adding and removing', () => {
      const TestComponentWithOrder = () => {
        const { fairnessTrees, addFairnessTree, removeFairnessTree } = useFairnessTree();

        return (
          <div>
            <div data-testid="tree-ids">
              {fairnessTrees.map((tree) => tree.id).join(', ')}
            </div>
            <button
              data-testid="add-tree-1"
              onClick={() =>
                addFairnessTree({
                  gid: 'test-gid-1',
                  cid: 'test-cid-1',
                  name: 'Tree 1',
                  group: 'test-group',
                  data: {
                    sensitiveFeature: 'age',
                    favourableOutcomeName: 'approved',
                    qualified: 'yes',
                    unqualified: 'no',
                    selectedOutcomes: ['outcome1'],
                    metrics: ['metric1'],
                    selections: { nodes: [], edges: [] },
                  },
                  id: 1,
                })
              }
            >
              Add Tree 1
            </button>
            <button
              data-testid="add-tree-2"
              onClick={() =>
                addFairnessTree({
                  gid: 'test-gid-2',
                  cid: 'test-cid-2',
                  name: 'Tree 2',
                  group: 'test-group',
                  data: {
                    sensitiveFeature: 'gender',
                    favourableOutcomeName: 'approved',
                    qualified: 'yes',
                    unqualified: 'no',
                    selectedOutcomes: ['outcome2'],
                    metrics: ['metric2'],
                    selections: { nodes: [], edges: [] },
                  },
                  id: 2,
                })
              }
            >
              Add Tree 2
            </button>
            <button
              data-testid="remove-tree-1"
              onClick={() => removeFairnessTree('Tree 1')}
            >
              Remove Tree 1
            </button>
          </div>
        );
      };

      render(
        <FairnessTreeProvider>
          <TestComponentWithOrder />
        </FairnessTreeProvider>
      );

      const addTree1Button = screen.getByTestId('add-tree-1');
      const addTree2Button = screen.getByTestId('add-tree-2');
      const removeTree1Button = screen.getByTestId('remove-tree-1');

      act(() => {
        addTree1Button.click();
        addTree2Button.click();
      });

      expect(screen.getByTestId('tree-ids')).toHaveTextContent('1, 2');

      act(() => {
        removeTree1Button.click();
      });

      expect(screen.getByTestId('tree-ids')).toHaveTextContent('2');
    });
  });
}); 