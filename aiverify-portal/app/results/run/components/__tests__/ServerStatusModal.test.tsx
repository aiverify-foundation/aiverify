import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServerStatusModal from '../ServerStatusModal';

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: { name: string; size: number; color: string }) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color}>
      Icon: {name}
    </div>
  ),
  IconName: {
    Warning: 'Warning',
  },
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, variant, size, onClick }: any) => (
    <button
      data-testid={`button-${text?.toLowerCase()}`}
      data-variant={variant}
      data-size={size}
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

describe('ServerStatusModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ServerStatusModal isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Test Engine Worker Not Running')).not.toBeInTheDocument();
    expect(screen.queryByTestId('button-close')).not.toBeInTheDocument();
  });

  it('renders modal content when isOpen is true', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Test Engine Worker Not Running')).toBeInTheDocument();
    expect(screen.getByTestId('button-close')).toBeInTheDocument();
  });

  it('displays the warning icon with correct props', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const warningIcon = screen.getByTestId('icon-Warning');
    expect(warningIcon).toBeInTheDocument();
    expect(warningIcon).toHaveAttribute('data-size', '24');
    expect(warningIcon).toHaveAttribute('data-color', '#FF9800');
  });

  it('displays the modal title', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Test Engine Worker Not Running')).toBeInTheDocument();
  });

  it('displays the main description text', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText((content) => content.includes('The Test Engine Worker service needs to be running to execute tests'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Please start the service by following the instructions in the README.md file'))).toBeInTheDocument();
  });

  it('displays the additional information text', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/The Test Engine Worker needs to be running for test execution/)).toBeInTheDocument();
    expect(screen.getByText(/Please keep the terminal window open while running tests/)).toBeInTheDocument();
  });

  it('renders close button with correct props', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent('Close');
    expect(closeButton).toHaveAttribute('data-variant', 'primary');
    expect(closeButton).toHaveAttribute('data-size', 'md');
  });

  it('calls onClose when close button is clicked', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies correct modal styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    const heading = screen.getByText('Test Engine Worker Not Running');
    const modalOverlay = heading.closest('div')?.parentElement?.parentElement;
    expect(modalOverlay).toHaveClass('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center');
  });

  it('applies correct modal content styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    const heading = screen.getByText('Test Engine Worker Not Running');
    const modalContent = heading.closest('div')?.parentElement;
    expect(modalContent).toHaveClass('max-w-2xl', 'rounded-lg', 'bg-secondary-800', 'p-8');
  });

  it('applies correct header styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const header = screen.getByText('Test Engine Worker Not Running').closest('div');
    expect(header).toHaveClass('mb-4', 'flex', 'items-center');
  });

  it('applies correct title styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const title = screen.getByText('Test Engine Worker Not Running');
    expect(title).toHaveClass('ml-2', 'text-xl', 'font-bold');
  });

  it('applies correct description styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const description = screen.getByText(/The Test Engine Worker service needs to be running/);
    expect(description).toHaveClass('mb-4');
  });

  it('applies correct additional info styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const additionalInfo = screen.getByText(/The Test Engine Worker needs to be running for test execution/);
    expect(additionalInfo).toHaveClass('mb-6', 'text-sm', 'text-gray-400');
  });

  it('applies correct button container styling', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const buttonContainer = screen.getByTestId('button-close').closest('div');
    expect(buttonContainer).toHaveClass('flex', 'justify-end');
  });

  it('handles multiple close button clicks', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });

  it('handles rapid close button clicks', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    
    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(closeButton);
    }
    
    expect(mockOnClose).toHaveBeenCalledTimes(10);
  });

  it('maintains modal visibility after close button click until onClose is called', () => {
    const { rerender } = render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    fireEvent.click(closeButton);
    
    // Modal should still be visible until parent component updates isOpen
    expect(screen.getByText('Test Engine Worker Not Running')).toBeInTheDocument();
    
    // Simulate parent component closing the modal
    rerender(<ServerStatusModal isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Test Engine Worker Not Running')).not.toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByRole('heading', { name: 'Test Engine Worker Not Running' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('handles undefined onClose function', () => {
    render(<ServerStatusModal isOpen={true} onClose={undefined as any} />);
    
    const closeButton = screen.getByTestId('button-close');
    expect(() => fireEvent.click(closeButton)).not.toThrow();
  });

  it('handles null onClose function', () => {
    render(<ServerStatusModal isOpen={true} onClose={null as any} />);
    
    const closeButton = screen.getByTestId('button-close');
    expect(() => fireEvent.click(closeButton)).not.toThrow();
  });

  it('renders with correct z-index for modal overlay', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    const heading = screen.getByText('Test Engine Worker Not Running');
    const modalOverlay = heading.closest('div')?.parentElement?.parentElement;
    expect(modalOverlay).toHaveClass('z-50');
  });

  it('renders with correct positioning for modal overlay', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    const heading = screen.getByText('Test Engine Worker Not Running');
    const modalOverlay = heading.closest('div')?.parentElement?.parentElement;
    expect(modalOverlay).toHaveClass('fixed', 'inset-0');
  });

  it('renders with correct centering for modal overlay', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    const heading = screen.getByText('Test Engine Worker Not Running');
    const modalOverlay = heading.closest('div')?.parentElement?.parentElement;
    expect(modalOverlay).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('handles keyboard events on close button', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    
    // Test Enter key
    fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
    expect(mockOnClose).not.toHaveBeenCalled(); // Button click should not trigger on keyDown
    
    // Test Space key
    fireEvent.keyDown(closeButton, { key: ' ', code: 'Space' });
    expect(mockOnClose).not.toHaveBeenCalled(); // Button click should not trigger on keyDown
  });

  it('handles mouse events on close button', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('button-close');
    
    // Test mouse down
    fireEvent.mouseDown(closeButton);
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Test mouse up
    fireEvent.mouseUp(closeButton);
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Test click (should trigger onClose)
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders with correct text content structure', () => {
    render(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    
    // Check that all text content is present and properly structured
    expect(screen.getByText('Test Engine Worker Not Running')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('The Test Engine Worker service needs to be running to execute tests'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Please start the service by following the instructions in the README.md file'))).toBeInTheDocument();
    expect(screen.getByText(/The Test Engine Worker needs to be running for test execution/)).toBeInTheDocument();
    expect(screen.getByText(/Please keep the terminal window open while running tests/)).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('handles modal state changes correctly', () => {
    const { rerender } = render(<ServerStatusModal isOpen={false} onClose={mockOnClose} />);
    
    // Initially closed
    expect(screen.queryByText('Test Engine Worker Not Running')).not.toBeInTheDocument();
    
    // Open modal
    rerender(<ServerStatusModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Test Engine Worker Not Running')).toBeInTheDocument();
    
    // Close modal
    rerender(<ServerStatusModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Test Engine Worker Not Running')).not.toBeInTheDocument();
  });
}); 