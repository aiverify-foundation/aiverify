import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DynamicInputRenderer from '../DynamicInputRenderer';
import { InputBlock, InputBlockData } from '@/app/types';
import { FairnessTree } from '@/app/inputs/utils/types';

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

// Mock the imported components
jest.mock('@/app/inputs/[gid]/[cid]/components/ModalView', () => ({
  FairnessTreeModalContent: ({ gid, cid, projectId, flow }: any) => (
    <div data-testid="fairness-tree-modal-content">
      Modal Content - {gid}/{cid} - Project: {projectId} - Flow: {flow}
    </div>
  ),
}));

// Create a mock that can be controlled to throw errors
const mockStandaloneView = jest.fn(({ initialTrees }: { initialTrees: FairnessTree[] }) => (
  <div data-testid="standalone-view">
    <span data-testid="trees-count">{initialTrees?.length || 0}</span>
    {initialTrees?.map((tree, index) => (
      <div key={index} data-testid={`tree-${index}`}>
        {tree.name}
      </div>
    ))}
  </div>
));

jest.mock('@/app/inputs/[gid]/[cid]/components/StandaloneView', () => ({
  StandaloneView: (props: any) => mockStandaloneView(props),
}));

jest.mock('@/app/inputs/components/DynamicInputBlockList', () => ({
  DynamicInputBlockList: ({ title, description, inputBlock, inputBlockData }: any) => (
    <div data-testid="dynamic-input-block-list">
      <h3>{title}</h3>
      <p>{description}</p>
      <span data-testid="input-block-gid">{inputBlock.gid}</span>
      <span data-testid="input-block-cid">{inputBlock.cid}</span>
      <span data-testid="input-block-data-count">{Array.isArray(inputBlockData) ? inputBlockData.length : 0}</span>
    </div>
  ),
}));

describe('DynamicInputRenderer', () => {
  const baseInputBlock: InputBlock = {
    gid: 'test-group',
    cid: 'test-component',
    name: 'Test Input Block',
    description: 'Test Description',
  };

  const mockFairnessTree: FairnessTree = {
    id: 1,
    gid: 'test-group',
    cid: 'test-component',
    name: 'Test Tree',
    group: 'Test Group',
    data: {
      sensitiveFeature: 'age',
      favourableOutcomeName: 'approved',
      qualified: '18-25,26-35',
      unqualified: '36-50,51+',
      selectedOutcomes: ['approved', 'rejected'],
      metrics: ['statistical_parity'],
      selections: {
        nodes: ['18-25', '26-35'],
        edges: ['edge1'],
      },
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockInputBlockData: InputBlockData[] = [
    {
      gid: 'test-group',
      cid: 'test-component',
      name: 'Test Data 1',
      group: 'Test Group',
      data: { key1: 'value1' },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fullScreen input blocks', () => {
    const fullScreenInputBlock: InputBlock = {
      ...baseInputBlock,
      fullScreen: true,
    };

    describe('with projectId and flow (modal version)', () => {
      it('renders FairnessTreeModalContent when projectId and flow are provided', () => {
        const searchParams = {
          projectId: 'test-project',
          flow: 'test-flow',
        };

        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData={[mockFairnessTree]}
            searchParams={searchParams}
          />
        );

        expect(screen.getByTestId('fairness-tree-modal-content')).toBeInTheDocument();
        expect(screen.getByText(/Modal Content - test-group\/test-component - Project: test-project - Flow: test-flow/)).toBeInTheDocument();
      });

      it('renders modal even with empty inputBlockData', () => {
        const searchParams = {
          projectId: 'test-project',
          flow: 'test-flow',
        };

        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData={null}
            searchParams={searchParams}
          />
        );

        expect(screen.getByTestId('fairness-tree-modal-content')).toBeInTheDocument();
      });
    });

    describe('without projectId and flow (standalone version)', () => {
      it('renders StandaloneView with normalized tree data when data is valid', () => {
        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData={[mockFairnessTree]}
          />
        );

        expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
        expect(screen.getByTestId('trees-count')).toHaveTextContent('1');
        expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree');
      });

      it('renders StandaloneView with empty array when inputBlockData is null', () => {
        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData={null}
          />
        );

        expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
        expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
      });

      it('renders StandaloneView with empty array when inputBlockData is not an array', () => {
        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData="not an array"
          />
        );

        expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
        expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
      });

      it('renders StandaloneView with normalized data when tree items have missing data property', () => {
        const treeWithoutData = {
          ...mockFairnessTree,
          data: undefined,
        };

        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData={[treeWithoutData]}
          />
        );

        expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
        expect(screen.getByTestId('trees-count')).toHaveTextContent('1');
        expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree');
      });

      it('renders StandaloneView with empty array when normalization throws error', () => {
        // Create a mock that will cause the map function to throw
        const mockDataWithError = [{
          ...mockFairnessTree,
          // This will cause an error when trying to access properties
          get data() { throw new Error('Mock data getter error'); }
        }];

        render(
          <DynamicInputRenderer
            title="Test Title"
            description="Test Description"
            inputBlock={fullScreenInputBlock}
            inputBlockData={mockDataWithError}
          />
        );

        expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
        expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
      });
    });
  });

  describe('non-fullScreen input blocks', () => {
    it('renders DynamicInputBlockList when inputBlockData is an array', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={baseInputBlock}
          inputBlockData={mockInputBlockData}
        />
      );

      expect(screen.getByTestId('dynamic-input-block-list')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByTestId('input-block-gid')).toHaveTextContent('test-group');
      expect(screen.getByTestId('input-block-cid')).toHaveTextContent('test-component');
      expect(screen.getByTestId('input-block-data-count')).toHaveTextContent('1');
    });

    it('renders DynamicInputBlockList with empty array when inputBlockData is not an array', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={baseInputBlock}
          inputBlockData="not an array"
        />
      );

      expect(screen.getByTestId('dynamic-input-block-list')).toBeInTheDocument();
      expect(screen.getByTestId('input-block-data-count')).toHaveTextContent('0');
    });

    it('renders DynamicInputBlockList with empty array when inputBlockData is null', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={baseInputBlock}
          inputBlockData={null}
        />
      );

      expect(screen.getByTestId('dynamic-input-block-list')).toBeInTheDocument();
      expect(screen.getByTestId('input-block-data-count')).toHaveTextContent('0');
    });
  });

  describe('error handling', () => {
    it('renders error fallback when main render logic throws an error', () => {
      // Mock console.error to track if error is logged
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create an input block that will cause an error when accessing fullScreen property
      const invalidInputBlock = {
        ...baseInputBlock,
        get fullScreen() { throw new Error('Mock fullScreen getter error'); }
      } as any;

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={invalidInputBlock}
          inputBlockData={[mockFairnessTree]}
        />
      );

      expect(screen.getByText('Error loading input block')).toBeInTheDocument();
      expect(screen.getByText(/There was an error loading the component for input block/)).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-input-block-list')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('renders error fallback with correct inputBlockData handling when error occurs', () => {
      // Mock console.error to track if error is logged
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create an input block that will cause an error when accessing fullScreen property
      const invalidInputBlock = {
        ...baseInputBlock,
        get fullScreen() { throw new Error('Mock fullScreen getter error'); }
      } as any;

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={invalidInputBlock}
          inputBlockData="not an array"
        />
      );

      expect(screen.getByText('Error loading input block')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-input-block-list')).toBeInTheDocument();
      expect(screen.getByTestId('input-block-data-count')).toHaveTextContent('0');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('searchParams handling', () => {
    it('handles undefined searchParams gracefully', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={baseInputBlock}
          inputBlockData={mockInputBlockData}
        />
      );

      expect(screen.getByTestId('dynamic-input-block-list')).toBeInTheDocument();
    });

    it('handles searchParams with only projectId', () => {
      const searchParams = {
        projectId: 'test-project',
      };

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={{ ...baseInputBlock, fullScreen: true }}
          inputBlockData={[mockFairnessTree]}
          searchParams={searchParams}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
    });

    it('handles searchParams with only flow', () => {
      const searchParams = {
        flow: 'test-flow',
      };

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={{ ...baseInputBlock, fullScreen: true }}
          inputBlockData={[mockFairnessTree]}
          searchParams={searchParams}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
    });
  });

  describe('normalizeTreeData function (via component integration)', () => {
    const fullScreenInputBlock: InputBlock = {
      ...baseInputBlock,
      fullScreen: true,
    };

    it('handles null data correctly', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData={null}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
    });

    it('handles undefined data correctly', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData={undefined}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
    });

    it('handles non-array data correctly', () => {
      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData="string data"
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
    });

    it('handles array with items missing data property', () => {
      const treeWithoutData = {
        id: 1,
        gid: 'test-group',
        cid: 'test-component',
        name: 'Test Tree',
        group: 'Test Group',
        // data property is missing
      };

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData={[treeWithoutData]}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('1');
      expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree');
    });

    it('handles array with items having null data property', () => {
      const treeWithNullData = {
        ...mockFairnessTree,
        data: null,
      };

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData={[treeWithNullData]}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('1');
      expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree');
    });

    it('handles array with items having undefined data property', () => {
      const treeWithUndefinedData = {
        ...mockFairnessTree,
        data: undefined,
      };

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData={[treeWithUndefinedData]}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('1');
      expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree');
    });

    it('handles array with items having falsy data property', () => {
      const treeWithFalsyData = {
        ...mockFairnessTree,
        data: false,
      };

      render(
        <DynamicInputRenderer
          title="Test Title"
          description="Test Description"
          inputBlock={fullScreenInputBlock}
          inputBlockData={[treeWithFalsyData]}
        />
      );

      expect(screen.getByTestId('standalone-view')).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('1');
      expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree');
    });
  });
}); 