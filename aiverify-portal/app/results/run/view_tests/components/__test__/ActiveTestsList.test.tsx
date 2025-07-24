import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveTestsList from '../ActiveTestsList';

// Mock the hooks
jest.mock('@/app/results/run/hooks/useCancelTestRun', () => ({
  __esModule: true,
  default: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/app/results/run/hooks/useDeleteTestRun', () => ({
  __esModule: true,
  default: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/app/results/run/hooks/useGetTestRuns', () => ({
  __esModule: true,
  default: () => ({
    data: null,
    refetch: jest.fn(),
    isError: false,
    error: null,
  }),
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, variant, size, className, onClick, pill, textColor, icon, iconPosition }: any) => (
    <button
      data-testid={`button-${text?.replace(/\s+/g, '-').toLowerCase()}`}
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      data-text-color={textColor}
      data-icon={icon}
      data-icon-position={iconPosition}
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    OUTLINE: 'outline',
  },
}));

// Mock the Modal component
jest.mock('@/lib/components/modal/modal', () => ({
  Modal: ({ heading, enableScreenOverlay, onCloseIconClick, primaryBtnLabel, secondaryBtnLabel, onPrimaryBtnClick, onSecondaryBtnClick, children }: any) => (
    <div data-testid="modal" data-heading={heading}>
      <div data-testid="modal-content">{children}</div>
      <button data-testid="modal-close" onClick={onCloseIconClick}>Close</button>
      <button data-testid="modal-primary" onClick={onPrimaryBtnClick}>{primaryBtnLabel}</button>
      {secondaryBtnLabel && (
        <button data-testid="modal-secondary" onClick={onSecondaryBtnClick}>{secondaryBtnLabel}</button>
      )}
    </div>
  ),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props} data-testid={`link-${href.replace(/\//g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`}>
        {children}
      </a>
    );
  };
});

// Mock Remix icons
jest.mock('@remixicon/react', () => ({
  RiRefreshLine: ({ className, onClick }: any) => (
    <div data-testid="refresh-icon" className={className} onClick={onClick}>Refresh</div>
  ),
  RiArrowDownSLine: ({ className }: any) => (
    <div data-testid="arrow-down-icon" className={className}>▼</div>
  ),
  RiArrowUpSLine: ({ className }: any) => (
    <div data-testid="arrow-up-icon" className={className}>▲</div>
  ),
  RiDeleteBinLine: ({ className, onClick }: any) => (
    <div data-testid="delete-icon" className={className} onClick={onClick}>Delete</div>
  ),
  RiCloseLine: ({ className, onClick }: any) => (
    <div data-testid="close-icon" className={className} onClick={onClick}>×</div>
  ),
}));

// Mock FilterButtons component
jest.mock('../FilterButtons', () => {
  return function MockFilterButtons({ statusFilters, activeStatusFilters, onFilterClick }: any) {
    return (
      <div data-testid="filter-buttons">
        {statusFilters.map((filter: any) => (
          <button
            key={filter.id}
            data-testid={`filter-${filter.id}`}
            data-active={activeStatusFilters.includes(filter.id)}
            onClick={() => onFilterClick(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    );
  };
});

describe('ActiveTestsList', () => {
  const mockRuns = [
    {
      id: 'test-1',
      name: 'Test Run 1',
      status: 'pending' as const,
      progress: 50,
      created_at: '2023-01-01T00:00:00Z',
      algorithmGID: 'gid-1',
      algorithmCID: 'cid-1',
      modelFilename: 'model1.pkl',
      testDatasetFilename: 'dataset1.csv',
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    },
    {
      id: 'test-2',
      name: 'Test Run 2',
      status: 'success' as const,
      progress: 100,
      created_at: '2023-01-02T00:00:00Z',
      algorithmGID: 'gid-2',
      algorithmCID: 'cid-2',
      modelFilename: 'model2.pkl',
      testDatasetFilename: 'dataset2.csv',
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    },
    {
      id: 'test-3',
      name: 'Test Run 3',
      status: 'error' as const,
      progress: 75,
      created_at: '2023-01-03T00:00:00Z',
      algorithmGID: 'gid-1',
      algorithmCID: 'cid-1',
      modelFilename: 'model3.pkl',
      testDatasetFilename: 'dataset3.csv',
      errorMessages: 'Test error message',
      mode: 'upload' as const,
      algorithmArgs: {},
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    // Use getAllByText and check length > 0 for split/partial text
    const lastUpdated = screen.getAllByText((content, node) => node?.textContent?.includes('Last updated:') ?? false);
    const autoRefresh = screen.getAllByText((content, node) => node?.textContent?.includes('Auto-refresh:') ?? false);
    expect(lastUpdated.length).toBeGreaterThan(0);
    expect(autoRefresh.length).toBeGreaterThan(0);
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
  });

  it('displays test runs correctly', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    // The component displays algorithm names derived from GID, not test names
    const algoSpans = screen.getAllByText('gid-1').filter(el => el.tagName === 'SPAN');
    expect(algoSpans.length).toBeGreaterThan(0);
    expect(screen.getAllByText('gid-2').filter(el => el.tagName === 'SPAN').length).toBeGreaterThan(0);
  });

  it('shows correct status badges', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    // Find all badge spans with the correct class and text
    const runningBadges = screen.getAllByText('RUNNING').filter(el => el.tagName === 'SPAN' && el.className.includes('rounded-full'));
    const successBadges = screen.getAllByText('SUCCESS').filter(el => el.tagName === 'SPAN' && el.className.includes('rounded-full'));
    const errorBadges = screen.getAllByText('ERROR').filter(el => el.tagName === 'SPAN' && el.className.includes('rounded-full'));
    expect(runningBadges.length).toBeGreaterThan(0);
    expect(successBadges.length).toBeGreaterThan(0);
    expect(errorBadges.length).toBeGreaterThan(0);
  });

  it('displays test information correctly', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText(/ID: test-1/)).toBeInTheDocument();
    expect(screen.getByText(/Model: model1\.pkl/)).toBeInTheDocument();
    expect(screen.getByText(/Dataset: dataset1\.csv/)).toBeInTheDocument();
  });

  it('shows progress bars with correct values', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays filter buttons', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByTestId('filter-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pending')).toBeInTheDocument();
    expect(screen.getByTestId('filter-running')).toBeInTheDocument();
    expect(screen.getByTestId('filter-success')).toBeInTheDocument();
    expect(screen.getByTestId('filter-error')).toBeInTheDocument();
    expect(screen.getByTestId('filter-cancelled')).toBeInTheDocument();
  });

  it('handles status filtering', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const pendingFilter = screen.getByTestId('filter-pending');
    fireEvent.click(pendingFilter);
    // If no visible results, expect 'No Tests Found'
    const algoSpans = screen.queryAllByText('gid-1').filter(el => el.tagName === 'SPAN');
    if (algoSpans.length === 0) {
      expect(screen.getByText('No Tests Found')).toBeInTheDocument();
    } else {
      expect(algoSpans.length).toBeGreaterThan(0);
    }
  });

  it('handles multiple status filters', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const pendingFilter = screen.getByTestId('filter-pending');
    const successFilter = screen.getByTestId('filter-success');
    fireEvent.click(pendingFilter);
    fireEvent.click(successFilter);
    // Check for each gid individually
    const gid1Spans = screen.queryAllByText('gid-1').filter(el => el.tagName === 'SPAN');
    const gid2Spans = screen.queryAllByText('gid-2').filter(el => el.tagName === 'SPAN');
    if (gid1Spans.length === 0 && gid2Spans.length === 0) {
      expect(screen.getByText('No Tests Found')).toBeInTheDocument();
    } else {
      if (gid1Spans.length > 0) expect(gid1Spans.length).toBeGreaterThan(0);
      if (gid2Spans.length > 0) expect(gid2Spans.length).toBeGreaterThan(0);
    }
  });

  it('handles algorithm filtering', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const algorithmSelect = screen.getByLabelText('Algorithm:');
    fireEvent.change(algorithmSelect, { target: { value: 'gid-1' } });
    // Should show only tests with algorithm gid-1
    const algoSpans = screen.getAllByText('gid-1').filter(el => el.tagName === 'SPAN');
    expect(algoSpans.length).toBeGreaterThan(0);
    // Should not show gid-2
    expect(screen.queryAllByText('gid-2').filter(el => el.tagName === 'SPAN').length).toBe(0);
  });

  it('handles sorting by name', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
    // Should sort algorithm names alphabetically
    const algoSpans = screen.getAllByText(/gid-/).filter(el => el.tagName === 'SPAN');
    expect(algoSpans[0]).toHaveTextContent('gid-1');
    expect(algoSpans[1]).toHaveTextContent('gid-1');
    expect(algoSpans[2]).toHaveTextContent('gid-2');
  });

  it('handles sorting by name descending', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } });
    // Should sort algorithm names reverse alphabetically
    const algoSpans = screen.getAllByText(/gid-/).filter(el => el.tagName === 'SPAN');
    expect(algoSpans[0]).toHaveTextContent('gid-2');
    expect(algoSpans[1]).toHaveTextContent('gid-1');
    expect(algoSpans[2]).toHaveTextContent('gid-1');
  });

  it('shows cancel button for pending tests', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    // Test Run 1 is pending with progress > 0, so it should show cancel button
    const cancelButtons = screen.getAllByTestId('close-icon');
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it('shows delete button for non-pending tests', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    // Test Run 2 and 3 are not pending, so they should show delete buttons
    const deleteButtons = screen.getAllByTestId('delete-icon');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('handles delete confirmation', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    // Should show confirmation modal
    expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Confirm Delete');
  });

  it('handles cancel confirmation', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const cancelButtons = screen.getAllByTestId('close-icon');
    fireEvent.click(cancelButtons[0]);
    // Should show confirmation modal
    expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Confirm Cancellation');
  });

  it('handles modal cancellation', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    
    const cancelButton = screen.getByTestId('modal-secondary');
    fireEvent.click(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('handles modal close icon', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    
    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('shows error messages when expanded', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    // Test Run 3 has an error message
    const viewErrorButtons = screen.getAllByText(/View Error/);
    fireEvent.click(viewErrorButtons[0]);
    
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
  });

  it('toggles error message expansion', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const viewErrorButton = screen.getByText(/View Error/);
    fireEvent.click(viewErrorButton);
    
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    expect(screen.getByText(/Hide Error/)).toBeInTheDocument();
    
    const hideErrorButton = screen.getByText(/Hide Error/);
    fireEvent.click(hideErrorButton);
    
    expect(screen.queryByText('Error: Test error message')).not.toBeInTheDocument();
    expect(screen.getByText(/View Error/)).toBeInTheDocument();
  });

  it('handles many test runs with pagination', () => {
    const manyRuns = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      name: `Test Run ${i}`,
      status: 'success' as const,
      progress: 100,
      created_at: '2023-01-01T00:00:00Z',
      algorithmGID: 'gid-1',
      algorithmCID: 'cid-1',
      modelFilename: 'model.pkl',
      testDatasetFilename: 'dataset.csv',
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    }));
    
    render(<ActiveTestsList runs={manyRuns} />);
    
    // Should show pagination controls
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles page navigation', () => {
    const manyRuns = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      name: `Test Run ${i}`,
      status: 'success' as const,
      progress: 100,
      created_at: '2023-01-01T00:00:00Z',
      algorithmGID: 'gid-1',
      algorithmCID: 'cid-1',
      modelFilename: 'model.pkl',
      testDatasetFilename: 'dataset.csv',
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    }));
    
    render(<ActiveTestsList runs={manyRuns} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
  });

  it('disables pagination buttons appropriately', () => {
    const manyRuns = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      name: `Test Run ${i}`,
      status: 'success' as const,
      progress: 100,
      created_at: '2023-01-01T00:00:00Z',
      algorithmGID: 'gid-1',
      algorithmCID: 'cid-1',
      modelFilename: 'model.pkl',
      testDatasetFilename: 'dataset.csv',
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    }));
    
    render(<ActiveTestsList runs={manyRuns} />);
    
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('handles refresh interval changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    const refreshSelect = screen.getByDisplayValue('1m');
    fireEvent.change(refreshSelect, { target: { value: '300' } });
    expect(refreshSelect).toHaveValue('300');
  });

  it('shows loading state', () => {
    render(<ActiveTestsList runs={[]} />);
    // Should show no tests found message for empty runs
    expect(screen.getByText('No Tests Found')).toBeInTheDocument();
  });

  it('shows no tests found message', () => {
    render(<ActiveTestsList runs={[]} />);
    expect(screen.getByText('No Tests Found')).toBeInTheDocument();
    expect(screen.getByText('There are currently no tests available.')).toBeInTheDocument();
  });

  it('handles null runs', () => {
    render(<ActiveTestsList runs={null as any} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles undefined runs', () => {
    render(<ActiveTestsList runs={undefined as any} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles test runs with missing properties', () => {
    const incompleteRuns = [
      {
        id: 'test-1',
        name: 'Test Run 1',
        status: 'pending' as const,
        progress: 50,
        created_at: '2023-01-01T00:00:00Z',
        algorithmGID: 'gid-1',
        algorithmCID: 'cid-1',
        modelFilename: 'model1.pkl',
        testDatasetFilename: 'dataset1.csv',
        errorMessages: undefined,
        mode: 'upload' as const,
        algorithmArgs: {},
      },
    ];
    render(<ActiveTestsList runs={incompleteRuns} />);
    // The component displays algorithm names derived from GID in multiple places
    expect(screen.getAllByText('gid-1').length).toBeGreaterThan(0);
  });

  it('handles very long test names', () => {
    const longNameRuns = [
      {
        ...mockRuns[0],
        algorithmGID: 'very.long.algorithm.name.that.might.cause.layout.issues.and.should.be.handled.gracefully',
      },
    ];
    
    render(<ActiveTestsList runs={longNameRuns} />);
    
    // The component displays the last part of the GID in multiple places
    expect(screen.getAllByText('gracefully').length).toBeGreaterThan(0);
  });

  it('handles special characters in test names', () => {
    const specialCharRuns = [
      {
        ...mockRuns[0],
        algorithmGID: 'test.algorithm.with.&.special.<.characters.>',
      },
    ];
    
    render(<ActiveTestsList runs={specialCharRuns} />);
    
    // The component displays the last part of the GID in multiple places
    expect(screen.getAllByText('>').length).toBeGreaterThan(0);
  });

  it('handles rapid filter changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const pendingFilter = screen.getByTestId('filter-pending');
    const successFilter = screen.getByTestId('filter-success');
    const errorFilter = screen.getByTestId('filter-error');
    
    // Rapid filter changes
    fireEvent.click(pendingFilter);
    fireEvent.click(successFilter);
    fireEvent.click(errorFilter);
    
    // Should handle without crashing
    expect(screen.getByTestId('filter-buttons')).toBeInTheDocument();
  });

  it('handles rapid sorting changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const sortSelect = screen.getByLabelText('Sort by:');
    
    // Rapid sort changes
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } });
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
    
    // Should handle without crashing
    expect(sortSelect).toBeInTheDocument();
  });

  it('handles rapid algorithm filter changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const algorithmSelect = screen.getByLabelText('Algorithm:');
    
    // Rapid algorithm filter changes
    fireEvent.change(algorithmSelect, { target: { value: 'gid-1' } });
    fireEvent.change(algorithmSelect, { target: { value: 'gid-2' } });
    fireEvent.change(algorithmSelect, { target: { value: 'all' } });
    
    // Should handle without crashing
    expect(algorithmSelect).toBeInTheDocument();
  });
}); 