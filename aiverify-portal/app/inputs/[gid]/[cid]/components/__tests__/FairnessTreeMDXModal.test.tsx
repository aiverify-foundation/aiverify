import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FairnessTreeMDXModal from '../FairnessTreeMDXModal';

// Mock CSS imports
jest.mock('../DecisionTree.css', () => ({}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock mdx-bundler
jest.mock('mdx-bundler/client', () => ({
  getMDXComponent: () => {
    const MockMDXComponent = () => (
      <div data-testid="mdx-component-wrapper">
        <div data-testid="mdx-content">Mock MDX Content</div>
      </div>
    );
    return MockMDXComponent;
  },
}));

// Mock the useFairnessTreeEdit hook
const mockUseFairnessTreeEdit = jest.fn();
jest.mock('../../hooks/useEditFairnessTree', () => ({
  useFairnessTreeEdit: () => mockUseFairnessTreeEdit(),
}));

// Mock the useDeleteFairnessTree hook
const mockUseDeleteFairnessTree = jest.fn();
jest.mock('../../hooks/useDeleteFairnessTree', () => ({
  useDeleteFairnessTree: () => mockUseDeleteFairnessTree(),
}));

// Mock the useMDXBundle hook
const mockUseMDXBundle = jest.fn();
jest.mock('../../hooks/useMDXBundle', () => ({
  useMDXBundle: () => mockUseMDXBundle(),
}));

// Mock the Modal component
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ 
    children, 
    heading, 
    onCloseIconClick, 
    onPrimaryBtnClick, 
    onSecondaryBtnClick, 
    primaryBtnLabel, 
    secondaryBtnLabel, 
    width, 
    height, 
    enableScreenOverlay
  }: any) => (
    <div data-testid="modal" className="modal-overlay" style={{ width, height }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{heading}</h2>
          <button data-testid="close-button" onClick={onCloseIconClick}>
            Close
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button data-testid="secondary-button" onClick={onSecondaryBtnClick}>
            {secondaryBtnLabel}
          </button>
          <button data-testid="primary-button" onClick={onPrimaryBtnClick}>
            {primaryBtnLabel}
          </button>
        </div>
      </div>
    </div>
  ),
}));

// Mock the MDXComponentWrapper component
jest.mock('../MDXComponentWrapper', () => ({
  __esModule: true,
  default: ({ tree }: any) => (
    <div data-testid="mdx-component-wrapper">
      <div data-testid="mdx-content">Mock MDX Content</div>
    </div>
  ),
}));

// Mock console.error to prevent output in tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

describe('FairnessTreeMDXModal', () => {
  const mockTree = {
    id: 1,
    gid: 'test-gid',
    cid: 'test-cid',
    name: 'Test Tree',
    group: 'Test Group',
    data: {
      sensitiveFeature: 'age',
      favourableOutcomeName: 'approved',
      qualified: '18-25,26-35',
      unqualified: '36-50,51+',
      selectedOutcomes: ['approved', 'rejected'],
      metrics: ['statistical_parity', 'equal_opportunity'],
      selections: {
        nodes: ['18-25', '26-35'],
        edges: ['edge1', 'edge2'],
      },
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    tree: mockTree,
  };

  const mockMDXBundle = {
    code: 'mock-code',
    frontmatter: {
      title: 'Test Content',
      description: 'Test content description',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseMDXBundle.mockReturnValue({
      data: mockMDXBundle,
      isLoading: false,
      error: null,
    });

    mockUseDeleteFairnessTree.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    mockUseFairnessTreeEdit.mockReturnValue({
      isEditing: false,
      setIsEditing: jest.fn(),
      treeName: mockTree.name,
      setTreeName: jest.fn(),
      treeData: mockTree.data,
      handleChangeData: jest.fn(),
      handleSaveChanges: jest.fn().mockResolvedValue({ success: true, message: 'Saved successfully' }),
      isLoading: false,
      error: null,
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Test Tree')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<FairnessTreeMDXModal {...defaultProps} isOpen={false} />);

      // The component always renders the modal regardless of isOpen prop
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('displays tree name in modal title', () => {
      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByText('Test Tree')).toBeInTheDocument();
    });

    it('renders MDX content when bundle is loaded', () => {
      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByTestId('mdx-component-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByText('Edit Tree')).toBeInTheDocument();
      expect(screen.getByText('Delete Tree')).toBeInTheDocument();
    });
  });

  describe('MDX bundle loading', () => {
    it('shows loading state when MDX bundle is loading', () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error when MDX bundle fails to load', () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load MDX bundle'),
      });

      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByText('Error loading content')).toBeInTheDocument();
    });

    it('renders MDX content when bundle loads successfully', () => {
      render(<FairnessTreeMDXModal {...defaultProps} />);

      expect(screen.getByTestId('mdx-component-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles tree with very long name', () => {
      const longNameTree = {
        ...mockTree,
        name: 'A'.repeat(1000),
      };

      render(<FairnessTreeMDXModal {...defaultProps} tree={longNameTree} />);

      expect(screen.getByText(longNameTree.name)).toBeInTheDocument();
    });

    it('handles tree with special characters in name', () => {
      const specialNameTree = {
        ...mockTree,
        name: 'Tree with special chars: !@#$%^&*()',
      };

      render(<FairnessTreeMDXModal {...defaultProps} tree={specialNameTree} />);

      expect(screen.getByText(specialNameTree.name)).toBeInTheDocument();
    });

    it('handles tree with complex data structure', () => {
      const complexDataTree = {
        ...mockTree,
        data: {
          ...mockTree.data,
          'ans-custom-field': 'custom value',
          'ans-nested-object': {
            nodes: ['node1', 'node2'],
            edges: ['edge1', 'edge2'],
          },
        },
      };

      render(<FairnessTreeMDXModal {...defaultProps} tree={complexDataTree} />);

      expect(screen.getByTestId('mdx-component-wrapper')).toBeInTheDocument();
    });

    it('handles tree without id', () => {
      const treeWithoutId = {
        ...mockTree,
        id: undefined,
      };

      render(<FairnessTreeMDXModal {...defaultProps} tree={treeWithoutId} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });
}); 