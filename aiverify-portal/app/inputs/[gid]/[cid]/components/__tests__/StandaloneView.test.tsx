import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StandaloneView } from '../StandaloneView';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the FairnessTreeHydration component
jest.mock('../FairnessTreeHydration', () => {
  return function MockFairnessTreeHydration({ initialTrees }: { initialTrees: any[] }) {
    return (
      <div data-testid="fairness-tree-hydration">
        <span data-testid="trees-count">{initialTrees?.length || 0}</span>
        {initialTrees?.map((tree, index) => (
          <div key={index} data-testid={`tree-${index}`}>
            {tree.name}
          </div>
        ))}
      </div>
    );
  };
});

// Mock the ActionButtons component
jest.mock('../ActionButtons', () => {
  return function MockActionButtons() {
    return <div data-testid="action-buttons">Action Buttons</div>;
  };
});

describe('StandaloneView', () => {
  const mockTrees = [
    {
      id: 1,
      gid: 'group1',
      cid: 'component1',
      name: 'Test Tree 1',
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
    },
    {
      id: 2,
      gid: 'group1',
      cid: 'component1',
      name: 'Test Tree 2',
      group: 'Test Group',
      data: {
        sensitiveFeature: 'gender',
        favourableOutcomeName: 'hired',
        qualified: 'male,female',
        unqualified: 'other',
        selectedOutcomes: ['hired', 'not_hired'],
        metrics: ['statistical_parity'],
        selections: {
          nodes: ['male', 'female'],
          edges: ['edge3'],
        },
      },
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the standalone view with header and content', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      expect(screen.getByText('Decision Trees')).toBeInTheDocument();
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });

    it('displays correct tree count', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      expect(screen.getByTestId('trees-count')).toHaveTextContent('2');
    });

    it('renders individual tree names', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      expect(screen.getByTestId('tree-0')).toHaveTextContent('Test Tree 1');
      expect(screen.getByTestId('tree-1')).toHaveTextContent('Test Tree 2');
    });

    it('renders with empty trees array', () => {
      render(<StandaloneView initialTrees={[]} />);

      expect(screen.getByTestId('trees-count')).toHaveTextContent('0');
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('has navigation link to inputs page', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const backLink = screen.getByText('User Inputs').closest('a');
      expect(backLink).toHaveAttribute('href', '/inputs');
    });
  });

  describe('error handling', () => {
    it('displays error message when initialTrees is null', () => {
      render(<StandaloneView initialTrees={null as any} />);

      expect(screen.getByText('Error loading decision trees')).toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });

    it('displays error message when initialTrees is undefined', () => {
      render(<StandaloneView initialTrees={undefined as any} />);

      expect(screen.getByText('Error loading decision trees')).toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });

    it('displays error message when initialTrees is not an array', () => {
      render(<StandaloneView initialTrees={'not-an-array' as any} />);

      expect(screen.getByText('Error loading decision trees')).toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });

    it('displays error message when initialTrees is empty array', () => {
      render(<StandaloneView initialTrees={[]} />);

      // Should still render the component, not show error
      expect(screen.queryByText('Error loading decision trees')).not.toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });

    it('displays error message when initialTrees contains invalid objects', () => {
      const invalidTrees = [
        { id: 1, name: 'Valid Tree' }, // Missing required properties
        null,
        undefined,
        'not-an-object',
      ];

      render(<StandaloneView initialTrees={invalidTrees as any} />);

      expect(screen.getByText('Error loading decision trees')).toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });
  });

  describe('CSS classes and styling', () => {
    it('applies correct CSS classes to main container', () => {
      const { container } = render(<StandaloneView initialTrees={mockTrees} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('p-6');
    });

    it('applies correct CSS classes to header section', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const headerSection = screen.getByText('Decision Trees').closest('div')?.parentElement?.parentElement?.parentElement;
      expect(headerSection).toHaveClass('mb-1', 'flex', 'items-center', 'justify-between');
    });

    it('applies correct CSS classes to icon and text section', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const iconTextSection = screen.getByText('Decision Trees').closest('div')?.parentElement?.parentElement;
      expect(iconTextSection).toHaveClass('flex', 'items-center');
    });

    it('applies correct CSS classes to text content', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const textContent = screen.getByText('Decision Trees').closest('div')?.parentElement;
      expect(textContent).toHaveClass('ml-3');
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(2); // User Inputs and Decision Trees
      expect(headings[1]).toHaveTextContent('Decision Trees');
    });

    it('has clickable navigation link', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const backLink = screen.getByText('User Inputs');
      expect(backLink).toBeInTheDocument();
      expect(backLink.tagName).toBe('H1');
      expect(backLink.closest('a')).toHaveAttribute('href', '/inputs');
    });
  });

  describe('edge cases', () => {
    it('handles very large tree arrays', () => {
      const largeTrees = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        gid: 'group1',
        cid: 'component1',
        name: `Tree ${i}`,
        group: 'Test Group',
        data: {
          sensitiveFeature: 'age',
          favourableOutcomeName: 'approved',
          qualified: '18-25',
          unqualified: '26-35',
          selectedOutcomes: ['approved'],
          metrics: ['statistical_parity'],
          selections: {
            nodes: ['18-25'],
            edges: ['edge1'],
          },
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }));

      render(<StandaloneView initialTrees={largeTrees} />);

      expect(screen.getByTestId('trees-count')).toHaveTextContent('1000');
      expect(screen.getByTestId('fairness-tree-hydration')).toBeInTheDocument();
    });

    it('handles trees with special characters in names', () => {
      const specialTrees = [
        {
          ...mockTrees[0],
          name: 'Tree with special chars: !@#$%^&*()',
        },
      ];

      render(<StandaloneView initialTrees={specialTrees} />);

      expect(screen.getByTestId('tree-0')).toHaveTextContent('Tree with special chars: !@#$%^&*()');
    });

    it('handles trees with very long names', () => {
      const longName = 'A'.repeat(1000);
      const longNameTrees = [
        {
          ...mockTrees[0],
          name: longName,
        },
      ];

      render(<StandaloneView initialTrees={longNameTrees} />);

      expect(screen.getByTestId('tree-0')).toHaveTextContent(longName);
    });
  });

  describe('component integration', () => {
    it('passes initialTrees prop to FairnessTreeHydration', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      const hydrationComponent = screen.getByTestId('fairness-tree-hydration');
      expect(hydrationComponent).toBeInTheDocument();
      expect(screen.getByTestId('trees-count')).toHaveTextContent('2');
    });

    it('renders ActionButtons component', () => {
      render(<StandaloneView initialTrees={mockTrees} />);

      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByText('Action Buttons')).toBeInTheDocument();
    });
  });
}); 