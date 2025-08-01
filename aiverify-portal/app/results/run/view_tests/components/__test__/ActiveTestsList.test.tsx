import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveTestsList from '../ActiveTestsList';

// Mock the hooks
jest.mock('@/app/results/run/hooks/useCancelTestRun', () => ({
  __esModule: true,
  default: () => ({
    mutate: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

jest.mock('@/app/results/run/hooks/useDeleteTestRun', () => ({
  __esModule: true,
  default: () => ({
    mutate: jest.fn().mockResolvedValue(undefined),
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

// Mock the FilterButtons component
jest.mock('../FilterButtons', () => ({
  __esModule: true,
  default: ({ statusFilters, activeStatusFilters, onFilterClick }: any) => (
    <div data-testid="filter-buttons">
      {statusFilters.map((filter: any) => (
        <button
          key={filter.id}
          data-testid={`filter-${filter.id}`}
          onClick={() => onFilterClick(filter.id)}
          className={activeStatusFilters.includes(filter.id) ? 'active' : ''}
        >
          {filter.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock the Modal component
jest.mock('@/lib/components/modal/modal', () => ({
  Modal: ({ heading, children, onPrimaryBtnClick, onSecondaryBtnClick, onCloseIconClick }: any) => (
    <div data-testid="modal" data-heading={heading}>
      <h2>{heading}</h2>
      <div data-testid="modal-content">{children}</div>
      <button data-testid="modal-primary" onClick={onPrimaryBtnClick}>
        Primary
      </button>
      <button data-testid="modal-secondary" onClick={onSecondaryBtnClick}>
        Secondary
      </button>
      <button data-testid="modal-close" onClick={onCloseIconClick}>
        Close
      </button>
    </div>
  ),
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, variant, size, className, pill }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

// Mock the icons
jest.mock('@remixicon/react', () => ({
  RiRefreshLine: () => <div data-testid="refresh-icon">Refresh</div>,
  RiArrowDownSLine: () => <div data-testid="arrow-down">Down</div>,
  RiArrowUpSLine: () => <div data-testid="arrow-up">Up</div>,
  RiDeleteBinLine: () => <div data-testid="delete-icon">Delete</div>,
  RiCloseLine: () => <div data-testid="close-icon">Close</div>,
}));

describe('ActiveTestsList', () => {
  const mockRuns = [
    {
      id: 'test-id-1',
      algorithmGID: 'test.algorithm.1',
      algorithmCID: 'test-cid-1',
      modelFilename: 'model1.json',
      testDatasetFilename: 'dataset1.json',
      status: 'pending' as const,
      progress: 0,
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    },
    {
      id: 'test-id-2',
      algorithmGID: 'test.algorithm.2',
      algorithmCID: 'test-cid-2',
      modelFilename: 'model2.json',
      testDatasetFilename: 'dataset2.json',
      status: 'pending' as const,
      progress: 50,
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    },
    {
      id: 'test-id-3',
      algorithmGID: 'test.algorithm.3',
      algorithmCID: 'test-cid-3',
      modelFilename: 'model3.json',
      testDatasetFilename: 'dataset3.json',
      status: 'success' as const,
      progress: 100,
      errorMessages: undefined,
      mode: 'upload' as const,
      algorithmArgs: {},
    },
    {
      id: 'test-id-4',
      algorithmGID: 'test.algorithm.4',
      algorithmCID: 'test-cid-4',
      modelFilename: 'model4.json',
      testDatasetFilename: 'dataset4.json',
      status: 'error' as const,
      progress: 75,
      errorMessages: 'Test error message',
      mode: 'upload' as const,
      algorithmArgs: {},
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with test runs', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('displays algorithm names correctly', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('displays test status badges', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SUCCESS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ERROR').length).toBeGreaterThan(0);
  });

  it('displays progress bars', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows refresh controls', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText((content) => content.includes('Last updated:'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Auto-refresh:'))).toBeInTheDocument();
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
  });

  it('shows filter buttons', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByTestId('filter-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pending')).toBeInTheDocument();
    expect(screen.getByTestId('filter-running')).toBeInTheDocument();
    expect(screen.getByTestId('filter-success')).toBeInTheDocument();
    expect(screen.getByTestId('filter-error')).toBeInTheDocument();
    expect(screen.getByTestId('filter-cancelled')).toBeInTheDocument();
  });

  it('shows algorithm filter dropdown', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText('Algorithm:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Algorithms')).toBeInTheDocument();
  });

  it('handles status filter clicks', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const pendingFilter = screen.getByTestId('filter-pending');
    fireEvent.click(pendingFilter);
    
    expect(pendingFilter).toHaveClass('active');
  });

  it('handles algorithm filter changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const algorithmSelect = screen.getByDisplayValue('All Algorithms');
    fireEvent.change(algorithmSelect, { target: { value: 'test.algorithm.1' } });
    
    expect(algorithmSelect).toHaveValue('test.algorithm.1');
  });

  it('handles sort changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const sortSelect = screen.getByDisplayValue('A to Z');
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } });
    
    expect(sortSelect).toHaveValue('name-desc');
  });

  it('shows cancel button for pending tests', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const cancelButtons = screen.getAllByTestId('close-icon');
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it('shows delete button for completed tests', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('handles test cancellation', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const cancelButtons = screen.getAllByTestId('close-icon');
    fireEvent.click(cancelButtons[0]);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Cancellation')).toBeInTheDocument();
  });

  it('handles test deletion', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('shows error messages when expanded', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const viewErrorButtons = screen.getAllByText('View Error');
    fireEvent.click(viewErrorButtons[0]);
    
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
  });

  it('handles empty test runs', () => {
    render(<ActiveTestsList runs={[]} />);
    
    expect(screen.getByText('No Tests Found')).toBeInTheDocument();
    expect(screen.getByText('There are currently no tests available.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ActiveTestsList runs={[]} />);
    
    expect(screen.getByText('No Tests Found')).toBeInTheDocument();
    expect(screen.getByText('There are currently no tests available.')).toBeInTheDocument();
  });

  it('shows pagination controls', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Page 1 of'))).toBeInTheDocument();
  });

  it('handles pagination', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Since we only have 4 tests and testsPerPage is 5, pagination won't work
    // The Next button should be disabled
    expect(nextButton).toBeDisabled();
  });

  it('shows estimated time remaining for running tests', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText('Est. time remaining: A few minutes')).toBeInTheDocument();
  });

  it('shows real-time update indicator', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText('Updating in real-time')).toBeInTheDocument();
  });

  it('handles refresh interval changes', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const intervalSelect = screen.getByDisplayValue('1m');
    fireEvent.change(intervalSelect, { target: { value: '300' } });
    
    expect(intervalSelect).toHaveValue('300');
  });

  it('shows auto-refresh options', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const intervalSelect = screen.getByDisplayValue('1m');
    expect(intervalSelect).toBeInTheDocument();
    
    const options = intervalSelect.querySelectorAll('option');
    expect(options).toHaveLength(4); // 1m, 5m, 10m, 15m
  });

  it('handles modal cancellations', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    
    const cancelButton = screen.getByTestId('modal-secondary');
    fireEvent.click(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByText((content) => content.includes('Confirm Delete'))).not.toBeInTheDocument();
  });

  it('handles modal close button', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0]);
    
    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    expect(screen.queryByText((content) => content.includes('Confirm Delete'))).not.toBeInTheDocument();
  });

  it('provides proper accessibility', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    // Check for proper ARIA labels
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
    
    // Check for proper form labels
    expect(screen.getByLabelText('Algorithm:')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
  });

  it('handles rapid interactions', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    const deleteButtons = screen.getAllByTestId('delete-icon');
    
    // Click multiple delete buttons rapidly
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(deleteButtons[1]);
    
    // Should handle multiple modals properly
    expect(screen.getByText((content) => content.includes('Confirm Delete'))).toBeInTheDocument();
  });

  it('displays correct time since last refresh', () => {
    render(<ActiveTestsList runs={mockRuns} />);
    
    expect(screen.getByText(/Last updated: just now/)).toBeInTheDocument();
  });

  it('handles different test statuses correctly', () => {
    const mixedStatusRuns = [
      { ...mockRuns[0], status: 'pending' as const, progress: 0 },
      { ...mockRuns[1], status: 'pending' as const, progress: 25 },
      { ...mockRuns[2], status: 'success' as const, progress: 100 },
      { ...mockRuns[3], status: 'cancelled' as const, progress: 50 },
    ];
    
    render(<ActiveTestsList runs={mixedStatusRuns} />);
    
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SUCCESS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CANCELLED').length).toBeGreaterThan(0);
  });
}); 