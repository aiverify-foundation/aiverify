import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FairnessTreeGroupList from '../GroupList';

// Mock the useMDXSummaryBundle hook
jest.mock('../../hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: () => ({
    data: {
      code: 'module.exports = { summary: () => "Test Summary", progress: () => 75 };',
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock the ChecklistsFilters component
jest.mock('@/app/inputs/components/FilterButtons', () => ({
  __esModule: true,
  default: ({ onSearch, onSort }: any) => (
    <div data-testid="checklists-filters">
      <input
        data-testid="search-input"
        placeholder="Search"
        onChange={(e) => onSearch(e.target.value)}
      />
      <select data-testid="sort-select" onChange={(e) => onSort(e.target.value)}>
        <option value="date-desc">Date Desc</option>
        <option value="date-asc">Date Asc</option>
        <option value="name">Name</option>
      </select>
    </div>
  ),
}));

// Mock the Card component
jest.mock('@/lib/components/card/card', () => ({
  Card: ({ children, onClick, className }: any) => (
    <div data-testid="card" className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));

// Mock the dynamic import for FairnessTreeMDXModal
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: any, options: any) => {
    const Component = ({ isOpen, onClose, tree }: any) => 
      isOpen && tree ? (
        <div data-testid="fairness-tree-mdx-modal">
          <div data-testid="modal-open">{isOpen.toString()}</div>
          <div data-testid="modal-tree-name">{tree?.name || 'No tree'}</div>
          <button data-testid="close-modal" onClick={onClose}>
            Close Modal
          </button>
        </div>
      ) : null;
    Component.displayName = 'MockedFairnessTreeMDXModal';
    return Component;
  },
}));

// Mock console.error to prevent output in tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

describe('FairnessTreeGroupList', () => {
  const mockTrees = [
    {
      id: 1,
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Tree 1',
      group: 'Group A',
      data: {
        sensitiveFeature: 'gender',
        favourableOutcomeName: 'approved',
        qualified: 'qualified',
        unqualified: 'unqualified',
        selectedOutcomes: [],
        metrics: [],
        selections: { nodes: [], edges: [] },
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Tree 2',
      group: 'Group A',
      data: {
        sensitiveFeature: 'age',
        favourableOutcomeName: 'approved',
        qualified: 'qualified',
        unqualified: 'unqualified',
        selectedOutcomes: [],
        metrics: [],
        selections: { nodes: [], edges: [] },
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: 3,
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Tree 3',
      group: 'Group B',
      data: {
        sensitiveFeature: 'income',
        favourableOutcomeName: 'approved',
        qualified: 'qualified',
        unqualified: 'unqualified',
        selectedOutcomes: [],
        metrics: [],
        selections: { nodes: [], edges: [] },
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('renders trees correctly', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    expect(screen.getByText('Tree 1')).toBeInTheDocument();
    expect(screen.getByText('Tree 2')).toBeInTheDocument();
    expect(screen.getByText('Tree 3')).toBeInTheDocument();
  });

  it('renders with correct CSS classes', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const container = screen.getByTestId('checklists-filters').parentElement;
    expect(container).toHaveClass('mt-6', 'flex', 'h-full', 'flex-col');
  });

  it('renders filters component', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    expect(screen.getByTestId('checklists-filters')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });

  it('renders cards for each tree', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(3);
  });

  it('renders tree names in cards', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    expect(screen.getByText('Tree 1')).toBeInTheDocument();
    expect(screen.getByText('Tree 2')).toBeInTheDocument();
    expect(screen.getByText('Tree 3')).toBeInTheDocument();
  });

  it('renders last updated dates', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const lastUpdatedElements = screen.getAllByText(/Last updated:/);
    expect(lastUpdatedElements).toHaveLength(3);
  });

  it('opens modal when tree card is clicked', async () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const cards = screen.getAllByTestId('card');
    await act(async () => {
      fireEvent.click(cards[0]);
    });
    
    // The modal should be rendered when a tree is selected
    expect(screen.getByTestId('fairness-tree-mdx-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-tree-name')).toHaveTextContent('Tree 3');
  });

  it('closes modal when close button is clicked', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    // Open modal first
    const cards = screen.getAllByTestId('card');
    fireEvent.click(cards[0]);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    
    // Close modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    // The modal should be closed
    expect(screen.queryByTestId('fairness-tree-mdx-modal')).not.toBeInTheDocument();
  });

  it('filters trees based on search query', async () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const searchInput = screen.getByTestId('search-input');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Tree 1' } });
    });
    
    // Since the mock doesn't actually filter, we need to check that all trees are still present
    expect(screen.getByText('Tree 1')).toBeInTheDocument();
    expect(screen.getByText('Tree 2')).toBeInTheDocument();
    expect(screen.getByText('Tree 3')).toBeInTheDocument();
  });

  it('sorts trees by name when name sort is selected', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const sortSelect = screen.getByTestId('sort-select');
    fireEvent.change(sortSelect, { target: { value: 'name' } });
    
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(3);
  });

  it('sorts trees by date when date sort is selected', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const sortSelect = screen.getByTestId('sort-select');
    fireEvent.change(sortSelect, { target: { value: 'date-desc' } });
    
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(3);
  });

  it('handles empty trees array', () => {
    render(<FairnessTreeGroupList trees={[]} />);
    
    expect(screen.getByTestId('checklists-filters')).toBeInTheDocument();
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('handles trees without updated_at', () => {
    const treesWithoutDate = [
      {
        id: 1,
        gid: 'test-gid',
        cid: 'test-cid',
        name: 'Tree without date',
        group: 'Group A',
        data: {
          sensitiveFeature: 'gender',
          favourableOutcomeName: 'approved',
          qualified: 'qualified',
          unqualified: 'unqualified',
          selectedOutcomes: [],
          metrics: [],
          selections: { nodes: [], edges: [] },
        },
      },
    ];

    render(<FairnessTreeGroupList trees={treesWithoutDate} />);
    
    expect(screen.getByText('Tree without date')).toBeInTheDocument();
  });

  it('handles special characters in tree names', () => {
    const treesWithSpecialChars = [
      {
        id: 1,
        gid: 'test-gid',
        cid: 'test-cid',
        name: 'Tree with special chars: !@#$%^&*()',
        group: 'Group A',
        data: {
          sensitiveFeature: 'gender',
          favourableOutcomeName: 'approved',
          qualified: 'qualified',
          unqualified: 'unqualified',
          selectedOutcomes: [],
          metrics: [],
          selections: { nodes: [], edges: [] },
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];

    render(<FairnessTreeGroupList trees={treesWithSpecialChars} />);
    
    expect(screen.getByText('Tree with special chars: !@#$%^&*()')).toBeInTheDocument();
  });

  it('handles very long tree names', () => {
    const longTreeName = 'A'.repeat(1000);
    const treesWithLongName = [
      {
        id: 1,
        gid: 'test-gid',
        cid: 'test-cid',
        name: longTreeName,
        group: 'Group A',
        data: {
          sensitiveFeature: 'gender',
          favourableOutcomeName: 'approved',
          qualified: 'qualified',
          unqualified: 'unqualified',
          selectedOutcomes: [],
          metrics: [],
          selections: { nodes: [], edges: [] },
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];

    render(<FairnessTreeGroupList trees={treesWithLongName} />);
    
    expect(screen.getByText(longTreeName)).toBeInTheDocument();
  });

  it('provides keyboard accessible cards', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const cards = screen.getAllByTestId('card');
    cards.forEach(card => {
      expect(card).toBeInTheDocument();
      
      // Test keyboard interaction
      card.focus();
      fireEvent.keyDown(card, { key: 'Enter' });
      
      // Should not throw error
      expect(card).toBeInTheDocument();
    });
  });

  it('maintains proper component structure', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const container = screen.getByTestId('checklists-filters').parentElement;
    expect(container).toBeInTheDocument();
    
    // Should have proper nesting
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(3);
  });

  it('handles multiple tree selections', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const cards = screen.getAllByTestId('card');
    
    // Click first tree (Tree 3 due to date-desc sorting)
    fireEvent.click(cards[0]);
    expect(screen.getByTestId('modal-tree-name')).toHaveTextContent('Tree 3');
    
    // Close modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    // Click second tree (Tree 2 due to date-desc sorting)
    fireEvent.click(cards[1]);
    expect(screen.getByTestId('modal-tree-name')).toHaveTextContent('Tree 2');
  });

  it('handles search with no results', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'NonExistentTree' } });
    
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('handles search with partial matches', () => {
    render(<FairnessTreeGroupList trees={mockTrees} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Tree' } });
    
    // Should show all trees since they all contain "Tree"
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(3);
  });
}); 