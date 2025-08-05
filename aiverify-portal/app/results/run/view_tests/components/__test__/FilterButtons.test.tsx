import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterButtons from '../FilterButtons';

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, variant, size, className, onClick, pill, textColor, 'aria-pressed': ariaPressed, 'aria-label': ariaLabel }: any) => (
    <button
      data-testid={`button-${text?.toLowerCase()}`}
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      data-text-color={textColor}
      data-aria-pressed={ariaPressed}
      data-aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    OUTLINE: 'outline',
  },
}));

describe('FilterButtons', () => {
  const mockStatusFilters = [
    { id: 'pending', label: 'PENDING' },
    { id: 'running', label: 'RUNNING' },
    { id: 'success', label: 'SUCCESS' },
    { id: 'error', label: 'ERROR' },
    { id: 'cancelled', label: 'CANCELLED' },
  ];

  const mockOnFilterClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-pending')).toBeInTheDocument();
    expect(screen.getByTestId('button-running')).toBeInTheDocument();
    expect(screen.getByTestId('button-success')).toBeInTheDocument();
    expect(screen.getByTestId('button-error')).toBeInTheDocument();
    expect(screen.getByTestId('button-cancelled')).toBeInTheDocument();
  });

  it('renders all status filter buttons', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('calls onFilterClick when a button is clicked', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const pendingButton = screen.getByTestId('button-pending');
    fireEvent.click(pendingButton);
    
    expect(mockOnFilterClick).toHaveBeenCalledWith('pending');
  });

  it('calls onFilterClick with correct filter ID for each button', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const runningButton = screen.getByTestId('button-running');
    const successButton = screen.getByTestId('button-success');
    const errorButton = screen.getByTestId('button-error');
    const cancelledButton = screen.getByTestId('button-cancelled');
    
    fireEvent.click(runningButton);
    expect(mockOnFilterClick).toHaveBeenCalledWith('running');
    
    fireEvent.click(successButton);
    expect(mockOnFilterClick).toHaveBeenCalledWith('success');
    
    fireEvent.click(errorButton);
    expect(mockOnFilterClick).toHaveBeenCalledWith('error');
    
    fireEvent.click(cancelledButton);
    expect(mockOnFilterClick).toHaveBeenCalledWith('cancelled');
  });

  it('applies primary variant to active filters', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={['pending', 'running']}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-variant', 'outline');
  });

  it('applies outline variant to inactive filters', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={['pending']}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-variant', 'outline');
  });

  it('sets aria-pressed attribute correctly for active filters', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={['pending', 'error']}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-aria-pressed', 'true');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-aria-pressed', 'true');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-aria-pressed', 'false');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-aria-pressed', 'false');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-aria-pressed', 'false');
  });

  it('sets aria-pressed attribute to false for inactive filters', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-aria-pressed', 'false');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-aria-pressed', 'false');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-aria-pressed', 'false');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-aria-pressed', 'false');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-aria-pressed', 'false');
  });

  it('sets correct aria-label for each button', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-aria-label', 'Filter by PENDING');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-aria-label', 'Filter by RUNNING');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-aria-label', 'Filter by SUCCESS');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-aria-label', 'Filter by ERROR');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-aria-label', 'Filter by CANCELLED');
  });

  it('applies correct button styling', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const pendingButton = screen.getByTestId('button-pending');
    expect(pendingButton).toHaveAttribute('data-text-color', 'white');
    expect(pendingButton).toHaveAttribute('data-size', 'xs');
    expect(pendingButton).toHaveAttribute('data-pill', 'true');
  });

  it('applies correct container styling', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const container = screen.getByTestId('button-pending').closest('div');
    expect(container).toHaveClass('mt-2', 'flex', 'space-x-2');
  });

  it('handles empty status filters array', () => {
    render(
      <FilterButtons
        statusFilters={[]}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    // Should render without crashing
    expect(screen.queryByTestId('button-pending')).not.toBeInTheDocument();
  });

  it('handles empty active filters array', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    // All buttons should have outline variant
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-variant', 'outline');
  });

  it('handles all filters being active', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={['pending', 'running', 'success', 'error', 'cancelled']}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    // All buttons should have primary variant
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-error')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-cancelled')).toHaveAttribute('data-variant', 'primary');
  });

  it('handles case-sensitive filter IDs', () => {
    const caseSensitiveFilters = [
      { id: 'PENDING', label: 'PENDING' },
      { id: 'Running', label: 'Running' },
      { id: 'SUCCESS', label: 'SUCCESS' },
    ];
    
    render(
      <FilterButtons
        statusFilters={caseSensitiveFilters}
        activeStatusFilters={['PENDING', 'Running']}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByTestId('button-pending')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-running')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('button-success')).toHaveAttribute('data-variant', 'outline');
  });

  it('handles special characters in filter labels', () => {
    const specialCharFilters = [
      { id: 'pending', label: 'PENDING & ACTIVE' },
      { id: 'running', label: 'RUNNING (IN PROGRESS)' },
      { id: 'success', label: 'SUCCESS!' },
    ];
    
    render(
      <FilterButtons
        statusFilters={specialCharFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByText('PENDING & ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('RUNNING (IN PROGRESS)')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS!')).toBeInTheDocument();
  });

  it('handles long filter labels', () => {
    const longLabelFilters = [
      { id: 'pending', label: 'VERY LONG PENDING STATUS LABEL THAT MIGHT WRAP' },
      { id: 'running', label: 'ANOTHER VERY LONG RUNNING STATUS LABEL' },
    ];
    
    render(
      <FilterButtons
        statusFilters={longLabelFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    expect(screen.getByText('VERY LONG PENDING STATUS LABEL THAT MIGHT WRAP')).toBeInTheDocument();
    expect(screen.getByText('ANOTHER VERY LONG RUNNING STATUS LABEL')).toBeInTheDocument();
  });

  it('handles rapid button clicks', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const pendingButton = screen.getByTestId('button-pending');
    
    // Multiple rapid clicks
    fireEvent.click(pendingButton);
    fireEvent.click(pendingButton);
    fireEvent.click(pendingButton);
    
    expect(mockOnFilterClick).toHaveBeenCalledTimes(3);
    expect(mockOnFilterClick).toHaveBeenCalledWith('pending');
  });

  it('handles clicking different buttons rapidly', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const pendingButton = screen.getByTestId('button-pending');
    const runningButton = screen.getByTestId('button-running');
    const successButton = screen.getByTestId('button-success');
    
    // Click different buttons rapidly
    fireEvent.click(pendingButton);
    fireEvent.click(runningButton);
    fireEvent.click(successButton);
    
    expect(mockOnFilterClick).toHaveBeenCalledTimes(3);
    expect(mockOnFilterClick).toHaveBeenCalledWith('pending');
    expect(mockOnFilterClick).toHaveBeenCalledWith('running');
    expect(mockOnFilterClick).toHaveBeenCalledWith('success');
  });

  it('maintains button order based on statusFilters array', () => {
    const customOrderFilters = [
      { id: 'success', label: 'SUCCESS' },
      { id: 'error', label: 'ERROR' },
      { id: 'pending', label: 'PENDING' },
    ];
    
    render(
      <FilterButtons
        statusFilters={customOrderFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('SUCCESS');
    expect(buttons[1]).toHaveTextContent('ERROR');
    expect(buttons[2]).toHaveTextContent('PENDING');
  });

  it('handles duplicate filter IDs gracefully', () => {
    const duplicateFilters = [
      { id: 'pending', label: 'PENDING' },
      { id: 'pending-duplicate', label: 'PENDING DUPLICATE' },
      { id: 'running', label: 'RUNNING' },
    ];
    
    render(
      <FilterButtons
        statusFilters={duplicateFilters}
        activeStatusFilters={['pending']}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    // Should render all buttons, including duplicates
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('PENDING DUPLICATE')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-pressed');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('handles keyboard navigation', () => {
    render(
      <FilterButtons
        statusFilters={mockStatusFilters}
        activeStatusFilters={[]}
        onFilterClick={mockOnFilterClick}
      />
    );
    
    const pendingButton = screen.getByTestId('button-pending');
    
    // Test Enter key
    fireEvent.keyDown(pendingButton, { key: 'Enter', code: 'Enter' });
    expect(mockOnFilterClick).not.toHaveBeenCalled(); // Button click should not trigger on keyDown
    
    // Test Space key
    fireEvent.keyDown(pendingButton, { key: ' ', code: 'Space' });
    expect(mockOnFilterClick).not.toHaveBeenCalled(); // Button click should not trigger on keyDown
  });
}); 