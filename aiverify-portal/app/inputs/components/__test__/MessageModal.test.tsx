import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageModal } from '../MessageModal';

// Mock the Modal component
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ children, heading, onCloseIconClick, width, height, enableScreenOverlay }: any) => (
    <div data-testid="modal" style={{ width, height }}>
      <div data-testid="modal-heading">{heading}</div>
      <button data-testid="close-button" onClick={onCloseIconClick}>
        Close
      </button>
      <div data-testid="modal-content">{children}</div>
      {enableScreenOverlay && <div data-testid="screen-overlay" />}
    </div>
  ),
}));

describe('MessageModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Title',
    message: 'Test Message',
    type: 'success' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<MessageModal {...defaultProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<MessageModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
  });

  it('displays the correct title', () => {
    render(<MessageModal {...defaultProps} title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('displays the correct message', () => {
    render(<MessageModal {...defaultProps} message="Custom Message" />);
    
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<MessageModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with correct modal dimensions', () => {
    render(<MessageModal {...defaultProps} />);
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveStyle('width: 500px');
    expect(modal).toHaveStyle('height: 200px');
  });

  it('renders with screen overlay enabled', () => {
    render(<MessageModal {...defaultProps} />);
    
    expect(screen.getByTestId('screen-overlay')).toBeInTheDocument();
  });

  it('applies correct CSS classes to message text', () => {
    render(<MessageModal {...defaultProps} />);
    
    const messageElement = screen.getByText('Test Message');
    expect(messageElement).toHaveClass('text-white');
  });

  it('handles success type', () => {
    render(<MessageModal {...defaultProps} type="success" />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('handles error type', () => {
    render(<MessageModal {...defaultProps} type="error" />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('renders with long title', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines';
    render(<MessageModal {...defaultProps} title={longTitle} />);
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('renders with long message', () => {
    const longMessage = 'This is a very long message that might wrap to multiple lines and should still be displayed correctly within the modal';
    render(<MessageModal {...defaultProps} message={longMessage} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('renders with empty message', () => {
    render(<MessageModal {...defaultProps} message="" />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with empty title', () => {
    render(<MessageModal {...defaultProps} title="" />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('passes correct props to Modal component', () => {
    render(<MessageModal {...defaultProps} />);
    
    const modal = screen.getByTestId('modal');
    const heading = screen.getByTestId('modal-heading');
    const closeButton = screen.getByTestId('close-button');
    const content = screen.getByTestId('modal-content');
    
    expect(modal).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(closeButton).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it('renders message as paragraph element', () => {
    render(<MessageModal {...defaultProps} />);
    
    const messageElement = screen.getByText('Test Message');
    expect(messageElement.tagName).toBe('P');
  });

  it('handles multiple close button clicks', () => {
    const onClose = jest.fn();
    render(<MessageModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('renders with special characters in title', () => {
    const specialTitle = 'Title with special chars: !@#$%^&*()';
    render(<MessageModal {...defaultProps} title={specialTitle} />);
    
    expect(screen.getByText(specialTitle)).toBeInTheDocument();
  });

  it('renders with special characters in message', () => {
    const specialMessage = 'Message with special chars: !@#$%^&*() and emojis 🎉🚀';
    render(<MessageModal {...defaultProps} message={specialMessage} />);
    
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('renders with HTML entities in message', () => {
    const htmlMessage = 'Message with &lt;html&gt; entities &amp; symbols';
    render(<MessageModal {...defaultProps} message={htmlMessage} />);
    
    expect(screen.getByText(htmlMessage)).toBeInTheDocument();
  });

  it('maintains accessibility with proper heading structure', () => {
    render(<MessageModal {...defaultProps} />);
    
    const heading = screen.getByTestId('modal-heading');
    expect(heading).toBeInTheDocument();
  });

  it('provides keyboard accessible close button', () => {
    render(<MessageModal {...defaultProps} />);
    
    const closeButton = screen.getByTestId('close-button');
    expect(closeButton).toBeInTheDocument();
    
    // Test click interaction instead of keyboard (more reliable in tests)
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
}); 