import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsNameHeader } from '../ResultsNameHeader';

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, onClick, size, color }: any) => (
    <button
      data-testid={`icon-${name}`}
      onClick={onClick}
      style={{ fontSize: size, color }}
    >
      {name}
    </button>
  ),
  IconName: {
    Pencil: 'Pencil',
    Delete: 'Delete',
  },
}));

// Mock Modal component
jest.mock('@/lib/components/modal/modal', () => ({
  Modal: ({ heading, children, onPrimaryBtnClick, onSecondaryBtnClick, onCloseIconClick, primaryBtnLabel, secondaryBtnLabel }: any) => (
    <div data-testid="modal">
      <h2>{heading}</h2>
      {children}
      {primaryBtnLabel && (
        <button data-testid="modal-primary" onClick={onPrimaryBtnClick}>
          {primaryBtnLabel}
        </button>
      )}
      {secondaryBtnLabel && (
        <button data-testid="modal-secondary" onClick={onSecondaryBtnClick}>
          {secondaryBtnLabel}
        </button>
      )}
      <button data-testid="modal-close" onClick={onCloseIconClick}>
        Close
      </button>
    </div>
  ),
}));

describe('ResultsNameHeader', () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const defaultProps = {
    id: 1,
    name: 'Test Result Name',
    isSaving: false,
    onSave: mockOnSave,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial name', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    expect(screen.getByText('Test Result Name')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Pencil')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Delete')).toBeInTheDocument();
  });

  it('enters edit mode when pencil icon is clicked', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    expect(screen.getByDisplayValue('Test Result Name')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    
    expect(input).toHaveValue('Updated Name');
  });

  it('calls onSave with correct parameters when save is clicked', async () => {
    mockOnSave.mockResolvedValue(undefined);
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(1, 'Updated Name');
    });
  });

  it('calls onSave with trimmed name when save is clicked', async () => {
    mockOnSave.mockResolvedValue(undefined);
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: '  Updated Name  ' } });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(1, 'Updated Name');
    });
  });

  it('does not call onSave when name is empty', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: '   ' } });
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    // Should exit edit mode when name is empty
    expect(screen.getByText('Test Result Name')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test Result Name')).not.toBeInTheDocument();
  });

  it('does not call onSave when name is unchanged', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Test Result Name')).toBeInTheDocument(); // Back to view mode
  });

  it('exits edit mode when cancel is clicked', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.getByText('Test Result Name')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Updated Name')).not.toBeInTheDocument();
  });

  it('disables save and cancel buttons when isSaving is true', () => {
    render(<ResultsNameHeader {...defaultProps} isSaving={true} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const saveButton = screen.getByText('Saving...');
    const cancelButton = screen.getByText('Cancel');
    
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('shows "Saving..." text when isSaving is true', () => {
    render(<ResultsNameHeader {...defaultProps} isSaving={true} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('disables input when isSaving is true', () => {
    render(<ResultsNameHeader {...defaultProps} isSaving={true} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    expect(input).toBeDisabled();
  });

  it('shows delete confirmation modal when delete icon is clicked', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', async () => {
    mockOnDelete.mockResolvedValue(undefined);
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    
    fireEvent.click(screen.getByTestId('modal-primary'));
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
  });

  it('closes modal when cancel is clicked', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('modal-secondary'));
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('closes modal when close icon is clicked', () => {
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('modal-close'));
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('shows "Deleting..." text when deletion is in progress', async () => {
    mockOnDelete.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    fireEvent.click(screen.getByTestId('modal-primary'));
    
    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  it('handles save error gracefully', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'));
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(1, 'Updated Name');
    });
    
    // Should still be in edit mode after error
    expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
  });

  it('handles delete error gracefully', async () => {
    mockOnDelete.mockRejectedValue(new Error('Delete failed'));
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    fireEvent.click(screen.getByTestId('modal-primary'));
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
    
    // Modal should still be open after error
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('exits edit mode after successful save', async () => {
    mockOnSave.mockResolvedValue(undefined);
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    const input = screen.getByDisplayValue('Test Result Name');
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    
    fireEvent.click(screen.getByText('Save'));
    
    // Verify that onSave was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(1, 'Updated Name');
    });
    
    // Wait for the async operation to complete and edit mode to be exited
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Updated Name')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Result Name')).toBeInTheDocument();
  });

  it('closes modal after successful delete', async () => {
    mockOnDelete.mockResolvedValue(undefined);
    
    render(<ResultsNameHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('icon-Delete'));
    fireEvent.click(screen.getByTestId('modal-primary'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });
}); 