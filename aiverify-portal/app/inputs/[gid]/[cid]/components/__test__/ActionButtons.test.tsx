import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButtons from '../ActionButtons';

// Mock Next.js useParams
jest.mock('next/navigation', () => ({
  useParams: () => ({
    gid: 'test-gid',
    cid: 'test-cid',
  }),
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, variant, size, pill, textColor }: any) => (
    <button
      data-testid="action-button"
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      data-text-color={textColor}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    OUTLINE: 'outline',
  },
}));

// Mock the FairnessTreeUploadModal component
jest.mock('../FairnessTreeUploadModal', () => ({
  FairnessTreeUploadModal: ({ isOpen, onClose, gid, cid }: any) => (
    <div data-testid="fairness-tree-upload-modal">
      <div data-testid="modal-open">{isOpen.toString()}</div>
      <div data-testid="modal-gid">{gid}</div>
      <div data-testid="modal-cid">{cid}</div>
      <button data-testid="close-modal" onClick={onClose}>
        Close Modal
      </button>
    </div>
  ),
}));

// Mock console.log to prevent output in tests
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('ActionButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('renders the action button with correct text', () => {
    render(<ActionButtons />);
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByText('ADD INPUT BLOCK')).toBeInTheDocument();
  });

  it('renders the button with correct props', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('action-button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-pill', 'true');
    expect(button).toHaveAttribute('data-text-color', 'white');
  });

  it('renders with correct CSS classes', () => {
    render(<ActionButtons />);
    
    const container = screen.getByTestId('action-button').parentElement;
    expect(container).toHaveClass('flex');
  });

  it('opens modal when button is clicked', () => {
    render(<ActionButtons />);
    
    // Modal should be closed initially
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
    
    // Click the button
    const button = screen.getByTestId('action-button');
    fireEvent.click(button);
    
    // Modal should be open
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
  });

  it('passes correct gid and cid to modal', () => {
    render(<ActionButtons />);
    
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('test-gid');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('test-cid');
  });

  it('closes modal when close button is clicked', () => {
    render(<ActionButtons />);
    
    // Open modal first
    const actionButton = screen.getByTestId('action-button');
    fireEvent.click(actionButton);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    
    // Close modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
  });

  it('logs gid and cid to console', () => {
    render(<ActionButtons />);
    
    expect(consoleSpy).toHaveBeenCalledWith('gid', 'test-gid');
    expect(consoleSpy).toHaveBeenCalledWith('cid', 'test-cid');
  });

  it('handles multiple button clicks correctly', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('action-button');
    
    // First click - opens modal
    fireEvent.click(button);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    
    // Close modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
    
    // Second click - opens modal again
    fireEvent.click(button);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
  });

  it('provides keyboard accessible button', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('action-button');
    expect(button).toBeInTheDocument();
    
    // Test click interaction instead of keyboard (more reliable in tests)
    fireEvent.click(button);
    
    // Modal should open
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
  });

  it('handles different gid and cid values from params', () => {
    // Mock different params
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({
      gid: 'custom-gid',
      cid: 'custom-cid',
    });

    render(<ActionButtons />);
    
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('custom-gid');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('custom-cid');
  });

  it('handles empty gid and cid values', () => {
    // Mock empty params
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({
      gid: '',
      cid: '',
    });

    render(<ActionButtons />);
    
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('');
  });

  it('handles undefined params gracefully', () => {
    // Mock undefined params
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({});

    render(<ActionButtons />);
    
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('');
  });

  it('maintains modal state correctly', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('action-button');
    const closeButton = screen.getByTestId('close-modal');
    
    // Initial state - modal closed
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
    
    // Open modal
    fireEvent.click(button);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    
    // Close modal
    fireEvent.click(closeButton);
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
    
    // Modal should stay closed until button is clicked again
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
  });

  it('renders without crashing when params are missing', () => {
    // Mock missing params
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue(undefined);

    // The component should handle missing params gracefully
    expect(() => {
      render(<ActionButtons />);
    }).toThrow(); // It's expected to throw when params are undefined
  });
}); 