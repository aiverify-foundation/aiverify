import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PluginInputModal from '../PluginInputModal';

// Mock all external dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock('@mdx-js/react', () => ({
  MDXProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mdx-provider">{children}</div>,
}));

// Mock next/dynamic to return a simple component
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: () => Promise<any>, options: any) => {
    const Component = () => <div data-testid="dynamic-mdx-component">MDX Component</div>;
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

jest.mock('@/app/inputs/[gid]/[cid]/components/QueryProvider', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-provider">{children}</div>,
}));

jest.mock('@/app/inputs/[gid]/[cid]/components/Tooltip', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

jest.mock('@/app/inputs/[gid]/[cid]/context/FairnessTreeContext', () => ({
  FairnessTreeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fairness-tree-provider">{children}</div>
  ),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/[groupId]/[cid]/utils/Skeletion', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className}>
      Loading...
    </div>
  ),
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: ({
    heading,
    children,
    onCloseIconClick,
    onPrimaryBtnClick,
    onSecondaryBtnClick,
    primaryBtnLabel,
    secondaryBtnLabel,
    width,
    height,
    className,
    enableScreenOverlay,
  }: {
    heading: string;
    children: React.ReactNode;
    onCloseIconClick: () => void;
    onPrimaryBtnClick?: () => void;
    onSecondaryBtnClick?: () => void;
    primaryBtnLabel?: string;
    secondaryBtnLabel?: string;
    width?: string;
    height?: string;
    className?: string;
    enableScreenOverlay?: boolean;
  }) => (
    <div data-testid="modal" data-heading={heading} data-width={width} data-height={height} className={className}>
      <div data-testid="modal-header">{heading}</div>
      <div data-testid="modal-content">{children}</div>
      <div data-testid="modal-footer">
        {onSecondaryBtnClick && (
          <button data-testid="secondary-btn" onClick={onSecondaryBtnClick}>
            {secondaryBtnLabel}
          </button>
        )}
        {onPrimaryBtnClick && (
          <button data-testid="primary-btn" onClick={onPrimaryBtnClick}>
            {primaryBtnLabel}
          </button>
        )}
        <button data-testid="close-btn" onClick={onCloseIconClick}>
          Close
        </button>
      </div>
    </div>
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('PluginInputModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    pluginName: 'Test Plugin',
    inputBlockName: 'Test Input Block',
    mdxContent: `
      const TestComponent = ({ data, onChangeData }) => {
        return React.createElement('div', { 'data-testid': 'test-mdx-component' }, 'Test MDX Content');
      };
      TestComponent.validate = (data) => true; // Always return true for validation
      TestComponent.progress = (data) => {
        const fields = ['name', 'description'];
        const completed = fields.filter(field => data[field]).length;
        return Math.round((completed / fields.length) * 100);
      };
      return TestComponent;
    `,
    onSubmit: jest.fn(),
    gid: 'test-gid',
    cid: 'test-cid',
    width: 'md',
    fullScreen: false,
    frontmatter: {
      graphdata: { nodes: [], edges: [] },
      definitions: { test: 'definition' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: 'test-id' } }),
    } as Response);
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-header')).toHaveTextContent('Test Plugin - Test Input Block');
    });

    it('does not render when isOpen is false', () => {
      render(<PluginInputModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders with correct providers', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      expect(screen.getByTestId('query-provider')).toBeInTheDocument();
      expect(screen.getByTestId('fairness-tree-provider')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-provider')).toBeInTheDocument();
    });

    it('renders name input field with tooltip', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('placeholder', 'Enter a unique name for this input block');
      
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('data-content', 'Enter a unique name for this input block');
    });

    it('renders main form when MDX content is provided', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      // Should show the main form modal, not loading
      expect(screen.getByTestId('modal-header')).toHaveTextContent('Test Plugin - Test Input Block');
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates custom name when input changes', async () => {
      const user = userEvent.setup();
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      expect(nameInput).toHaveValue('Test Name');
    });

    it('clears error when name input changes', async () => {
      const user = userEvent.setup();
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      // Error should be cleared (no error message visible)
      expect(screen.queryByText('Please provide a unique name for this input block')).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<PluginInputModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      expect(screen.getByText('Please provide a unique name for this input block')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form successfully with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      render(<PluginInputModal {...defaultProps} onSubmit={onSubmit} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Test Name'),
        });
      });
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Input block "Test Name" was successfully created!')).toBeInTheDocument();
      });
    });

    it('shows error message when submission fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('handles API error responses', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);
      
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to save input block data')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<PluginInputModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByTestId('close-btn');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledWith(false);
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<PluginInputModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByTestId('secondary-btn');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalledWith(false);
    });

    it('resets form when modal is closed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      const { rerender } = render(<PluginInputModal {...defaultProps} onClose={onClose} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      // Close modal
      rerender(<PluginInputModal {...defaultProps} isOpen={false} onClose={onClose} />);
      
      // Reopen modal
      rerender(<PluginInputModal {...defaultProps} isOpen={true} onClose={onClose} />);
      
      // Form should be reset
      expect(screen.getByLabelText('Name')).toHaveValue('');
    });
  });

  describe('Modal Sizing', () => {
    it('applies correct width for different size props', () => {
      const { rerender } = render(<PluginInputModal {...defaultProps} width="xs" />);
      expect(screen.getByTestId('modal')).toHaveAttribute('data-width', '20rem');
      
      rerender(<PluginInputModal {...defaultProps} width="sm" />);
      expect(screen.getByTestId('modal')).toHaveAttribute('data-width', '30rem');
      
      rerender(<PluginInputModal {...defaultProps} width="lg" />);
      expect(screen.getByTestId('modal')).toHaveAttribute('data-width', '50rem');
      
      rerender(<PluginInputModal {...defaultProps} width="xl" />);
      expect(screen.getByTestId('modal')).toHaveAttribute('data-width', '60rem');
    });

    it('applies fullscreen styling when fullScreen is true', () => {
      render(<PluginInputModal {...defaultProps} fullScreen={true} />);
      
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('fixed inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 !transform-none rounded-none');
    });

    it('uses default width when no width prop is provided', () => {
      render(<PluginInputModal {...defaultProps} width={undefined} />);
      
      expect(screen.getByTestId('modal')).toHaveAttribute('data-width', '90%');
    });
  });

  describe('Message Modal', () => {
    it('shows success message modal after successful submission', async () => {
      const user = userEvent.setup();
      
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Input block "Test Name" was successfully created!')).toBeInTheDocument();
      });
    });

    it('closes message modal and refreshes on success', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<PluginInputModal {...defaultProps} onClose={onClose} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
      
      const successCloseButton = screen.getByTestId('close-btn');
      await user.click(successCloseButton);
      
      expect(onClose).toHaveBeenCalledWith(true);
    });

    it('closes error message modal without refreshing', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<PluginInputModal {...defaultProps} onClose={onClose} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test Name');
      
      const submitButton = screen.getByTestId('primary-btn');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
      
      const errorCloseButton = screen.getByTestId('close-btn');
      await user.click(errorCloseButton);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows main form when MDX content is provided', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      expect(screen.getByTestId('modal-header')).toHaveTextContent('Test Plugin - Test Input Block');
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toHaveAttribute('id', 'name');
      expect(nameInput).toHaveAttribute('required');
    });

    it('has proper button labels', () => {
      render(<PluginInputModal {...defaultProps} />);
      
      expect(screen.getByTestId('primary-btn')).toHaveTextContent('Submit');
      expect(screen.getByTestId('secondary-btn')).toHaveTextContent('Cancel');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty MDX content', () => {
      render(<PluginInputModal {...defaultProps} mdxContent="" />);
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-header')).toHaveTextContent('Test Plugin - Test Input Block');
    });

    it('handles undefined frontmatter', () => {
      render(<PluginInputModal {...defaultProps} frontmatter={undefined} />);
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('handles undefined width prop', () => {
      render(<PluginInputModal {...defaultProps} width={undefined} />);
      
      expect(screen.getByTestId('modal')).toHaveAttribute('data-width', '90%');
    });

    it('handles very long names', async () => {
      const user = userEvent.setup();
      const longName = 'A'.repeat(1000);
      
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, longName);
      
      expect(nameInput).toHaveValue(longName);
    });

    it('handles special characters in names', async () => {
      const user = userEvent.setup();
      const specialName = 'Test Name with Special Chars: !@#$%^&*()';
      
      render(<PluginInputModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, specialName);
      
      expect(nameInput).toHaveValue(specialName);
    });
  });
}); 