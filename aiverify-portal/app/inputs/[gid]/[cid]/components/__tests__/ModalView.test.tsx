import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FairnessTreeModalContent } from '../ModalView';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the QueryProvider component
jest.mock('../QueryProvider', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

// Mock the FairnessTreeProvider component
jest.mock('../../context/FairnessTreeContext', () => ({
  FairnessTreeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fairness-tree-provider">{children}</div>
  ),
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

describe('FairnessTreeModalContent', () => {
  const defaultProps = {
    gid: 'test-gid',
    cid: 'test-cid',
    projectId: 'test-project',
    flow: 'test-flow',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal content with correct structure', () => {
    render(<FairnessTreeModalContent {...defaultProps} />);
    
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('fairness-tree-provider')).toBeInTheDocument();
    expect(screen.getByTestId('fairness-tree-upload-modal')).toBeInTheDocument();
  });

  it('renders with correct CSS classes for modal container', () => {
    render(<FairnessTreeModalContent {...defaultProps} />);
    
    const modalContainer = screen.getByTestId('fairness-tree-upload-modal').parentElement;
    expect(modalContainer).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  it('passes correct props to FairnessTreeUploadModal', () => {
    render(<FairnessTreeModalContent {...defaultProps} />);
    
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('test-gid');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('test-cid');
  });

  it('handles modal close correctly', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

    render(<FairnessTreeModalContent {...defaultProps} />);
    
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/project/select_data?projectId=test-project&flow=test-flow'
      );
    });
  });

  it('renders with different gid and cid values', () => {
    const customProps = {
      ...defaultProps,
      gid: 'custom-gid',
      cid: 'custom-cid',
    };
    
    render(<FairnessTreeModalContent {...customProps} />);
    
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('custom-gid');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('custom-cid');
  });

  it('renders with different projectId and flow values', () => {
    const customProps = {
      ...defaultProps,
      projectId: 'custom-project',
      flow: 'custom-flow',
    };
    
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

    render(<FairnessTreeModalContent {...customProps} />);
    
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    expect(mockPush).toHaveBeenCalledWith(
      '/project/select_data?projectId=custom-project&flow=custom-flow'
    );
  });

  it('handles special characters in projectId and flow', () => {
    const customProps = {
      ...defaultProps,
      projectId: 'project with spaces',
      flow: 'flow-with-special-chars!@#',
    };
    
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

    render(<FairnessTreeModalContent {...customProps} />);
    
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    expect(mockPush).toHaveBeenCalledWith(
      '/project/select_data?projectId=project with spaces&flow=flow-with-special-chars!@#'
    );
  });

  it('maintains proper component hierarchy', () => {
    render(<FairnessTreeModalContent {...defaultProps} />);
    
    const queryProvider = screen.getByTestId('query-provider');
    const fairnessTreeProvider = screen.getByTestId('fairness-tree-provider');
    const uploadModal = screen.getByTestId('fairness-tree-upload-modal');
    
    expect(queryProvider).toContainElement(fairnessTreeProvider);
    expect(fairnessTreeProvider).toContainElement(uploadModal);
  });

  it('renders without crashing when router is not available', () => {
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: undefined,
    });

    expect(() => {
      render(<FairnessTreeModalContent {...defaultProps} />);
    }).not.toThrow();
  });

  it('handles empty string values for props', () => {
    const emptyProps = {
      gid: '',
      cid: '',
      projectId: '',
      flow: '',
    };
    
    render(<FairnessTreeModalContent {...emptyProps} />);
    
    expect(screen.getByTestId('modal-gid')).toHaveTextContent('');
    expect(screen.getByTestId('modal-cid')).toHaveTextContent('');
  });

  it('provides keyboard accessible close button', () => {
    render(<FairnessTreeModalContent {...defaultProps} />);
    
    const closeButton = screen.getByTestId('close-modal');
    expect(closeButton).toBeInTheDocument();
    
    // Test keyboard interaction
    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: 'Enter' });
    
    // Should not throw error
    expect(closeButton).toBeInTheDocument();
  });
}); 