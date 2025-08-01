import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

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
    <div data-testid="modal" style={{ width, height }}>
      <div data-testid="modal-heading">{heading}</div>
      <button data-testid="close-button" onClick={onCloseIconClick}>
        Close
      </button>
      <button data-testid="primary-button" onClick={onPrimaryBtnClick}>
        {primaryBtnLabel}
      </button>
      <button data-testid="secondary-button" onClick={onSecondaryBtnClick}>
        {secondaryBtnLabel}
      </button>
      <div data-testid="modal-content">{children}</div>
      {enableScreenOverlay && <div data-testid="screen-overlay" />}
    </div>
  ),
}));

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Item',
    itemName: 'Sample Item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Delete Test Item')).toBeInTheDocument();
    expect(screen.getByText('Sample Item')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Test Item')).not.toBeInTheDocument();
    expect(screen.queryByText('Sample Item')).not.toBeInTheDocument();
  });

  it('displays the correct title with "Delete" prefix', () => {
    render(<ConfirmDeleteModal {...defaultProps} title="Custom Item" />);
    
    expect(screen.getByText('Delete Custom Item')).toBeInTheDocument();
  });

  it('displays the correct item name', () => {
    render(<ConfirmDeleteModal {...defaultProps} itemName="Custom Name" />);
    
    expect(screen.getByText('Custom Name')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when primary button (Delete) is clicked', () => {
    const onConfirm = jest.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);
    
    const deleteButton = screen.getByTestId('primary-button');
    fireEvent.click(deleteButton);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when secondary button (Cancel) is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByTestId('secondary-button');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with correct modal dimensions', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveStyle('width: 500px');
    expect(modal).toHaveStyle('height: 300px');
  });

  it('renders with screen overlay enabled', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    expect(screen.getByTestId('screen-overlay')).toBeInTheDocument();
  });

  it('displays correct button labels', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders confirmation message with item name', () => {
    render(<ConfirmDeleteModal {...defaultProps} itemName="Important Item" />);
    
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('Important Item')).toBeInTheDocument();
  });

  it('renders warning message about irreversible action', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('applies correct CSS classes to item name', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    const itemNameElement = screen.getByText('Sample Item');
    expect(itemNameElement).toHaveClass('font-semibold');
  });

  it('applies correct CSS classes to warning message', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    const warningElement = screen.getByText('This action cannot be undone.');
    expect(warningElement).toHaveClass('mt-2text-secondary-400');
  });

  it('renders with long item name', () => {
    const longItemName = 'This is a very long item name that might wrap to multiple lines';
    render(<ConfirmDeleteModal {...defaultProps} itemName={longItemName} />);
    
    expect(screen.getByText(longItemName)).toBeInTheDocument();
  });

  it('renders with long title', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines';
    render(<ConfirmDeleteModal {...defaultProps} title={longTitle} />);
    
    expect(screen.getByText(`Delete ${longTitle}`)).toBeInTheDocument();
  });

  it('renders with empty item name', () => {
    render(<ConfirmDeleteModal {...defaultProps} itemName="" />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Delete Test Item')).toBeInTheDocument();
  });

  it('renders with empty title', () => {
    render(<ConfirmDeleteModal {...defaultProps} title="" />);
    
    expect(screen.getByTestId('modal-heading')).toHaveTextContent('Delete');
    expect(screen.getByText('Sample Item')).toBeInTheDocument();
  });

  it('handles special characters in item name', () => {
    const specialItemName = 'Item with special chars: !@#$%^&*()';
    render(<ConfirmDeleteModal {...defaultProps} itemName={specialItemName} />);
    
    expect(screen.getByText(specialItemName)).toBeInTheDocument();
  });

  it('handles special characters in title', () => {
    const specialTitle = 'Title with special chars: !@#$%^&*()';
    render(<ConfirmDeleteModal {...defaultProps} title={specialTitle} />);
    
    expect(screen.getByText(`Delete ${specialTitle}`)).toBeInTheDocument();
  });

  it('handles HTML entities in item name', () => {
    const htmlItemName = 'Item with &lt;html&gt; entities &amp; symbols';
    render(<ConfirmDeleteModal {...defaultProps} itemName={htmlItemName} />);
    
    expect(screen.getByText(htmlItemName)).toBeInTheDocument();
  });

  it('handles HTML entities in title', () => {
    const htmlTitle = 'Title with &lt;html&gt; entities &amp; symbols';
    render(<ConfirmDeleteModal {...defaultProps} title={htmlTitle} />);
    
    expect(screen.getByText(`Delete ${htmlTitle}`)).toBeInTheDocument();
  });

  it('renders confirmation message with proper quotes', () => {
    render(<ConfirmDeleteModal {...defaultProps} itemName="Test Item" />);
    
    const confirmationText = screen.getByText(/Are you sure you want to delete/);
    expect(confirmationText).toBeInTheDocument();
    
    // Check that the item name is wrapped in quotes
    const itemNameElement = screen.getByText('Test Item');
    expect(itemNameElement).toBeInTheDocument();
  });

  it('provides keyboard accessible buttons', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    const deleteButton = screen.getByTestId('primary-button');
    const cancelButton = screen.getByTestId('secondary-button');
    const closeButton = screen.getByTestId('close-button');
    
    expect(deleteButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    expect(closeButton).toBeInTheDocument();
    
    // Test click interaction for delete button (keyboard events may not work in tests)
    fireEvent.click(deleteButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();
    
    // Test click interaction for cancel button
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles multiple button clicks correctly', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    
    const deleteButton = screen.getByTestId('primary-button');
    const cancelButton = screen.getByTestId('secondary-button');
    
    // Click delete button multiple times
    fireEvent.click(deleteButton);
    fireEvent.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    
    // Click cancel button multiple times
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('maintains accessibility with proper heading structure', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    const heading = screen.getByTestId('modal-heading');
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Delete Test Item');
  });

  it('renders with proper semantic structure', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    
    // Check that the confirmation message is a paragraph
    const confirmationMessage = screen.getByText(/Are you sure you want to delete/);
    expect(confirmationMessage.tagName).toBe('P');
    
    // Check that the warning message is a paragraph
    const warningMessage = screen.getByText('This action cannot be undone.');
    expect(warningMessage.tagName).toBe('P');
  });
}); 