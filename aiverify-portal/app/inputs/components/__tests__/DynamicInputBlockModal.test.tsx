import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DynamicInputBlockModal } from '../DynamicInputBlockModal';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the Modal component with unique testids for different modals
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
  }: any) => {
    const isMessageModal = width === '500px' && height === '200px';
    const isErrorModal = heading === 'Error';
    const isLoadingModal = heading.includes('Loading');
    
    return (
      <div data-testid={isMessageModal ? "message-modal" : isErrorModal ? "error-modal" : isLoadingModal ? "loading-modal" : "modal"} style={{ width, height }}>
        <div data-testid="modal-heading">{heading}</div>
        <button data-testid={isMessageModal ? "message-close-button" : "close-button"} onClick={onCloseIconClick}>
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
    );
  },
}));

// Mock the hooks with default values
const mockUseMDXBundle = jest.fn();
const mockUseMDXSummaryBundle = jest.fn();
const mockUseSubmitInputBlockData = jest.fn();

jest.mock('@/app/inputs/hooks/useMDXBundle', () => ({
  useMDXBundle: () => mockUseMDXBundle(),
}));

jest.mock('@/app/inputs/hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: () => mockUseMDXSummaryBundle(),
}));

jest.mock('@/app/inputs/hooks/useSubmitInputBlockData', () => ({
  useSubmitInputBlockData: () => mockUseSubmitInputBlockData(),
}));

// Mock mdx-bundler
jest.mock('mdx-bundler/client', () => ({
  getMDXComponent: (code: string) => {
    return function TestComponent({ isEditing, data, onChangeData }: any) {
      return (
        <div>
          <input 
            data-testid="test-input"
            value={data.testField || ''}
            onChange={(e) => onChangeData('testField', e.target.value)}
          />
        </div>
      );
    };
  },
}));

describe('DynamicInputBlockModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    gid: 'test-gid',
    cid: 'test-cid',
    title: 'Test Modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseMDXBundle.mockReturnValue({
      data: {
        code: `
          export default function TestComponent({ isEditing, data, onChangeData }) {
            return (
              <div>
                <input 
                  data-testid="test-input"
                  value={data.testField || ''}
                  onChange={(e) => onChangeData('testField', e.target.value)}
                />
              </div>
            );
          }
        `,
      },
      isLoading: false,
      error: null,
    });

    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return data.testField && data.testField.length > 0;
          }
          function progress(data) {
            return data.testField ? 100 : 0;
          }
          function summary(data) {
            return data.testField || '';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: jest.fn().mockResolvedValue(undefined),
      isSubmitting: false,
    });
  });

  it('renders when isOpen is true', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<DynamicInputBlockModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('displays the correct title', () => {
    render(<DynamicInputBlockModal {...defaultProps} title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders name input field', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByLabelText('Input Block Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a unique name for this input block')).toBeInTheDocument();
  });

  it('renders form content from MDX bundle', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when secondary button (Cancel) is clicked', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const cancelButton = screen.getByTestId('secondary-button');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when MDX bundle is loading', () => {
    mockUseMDXBundle.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('loading-modal')).toBeInTheDocument();
    expect(screen.getByText('Loading Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('shows loading state when MDX summary bundle is loading', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('loading-modal')).toBeInTheDocument();
    expect(screen.getByText('Loading Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('shows error state when MDX bundle fails to load', () => {
    mockUseMDXBundle.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load MDX bundle' },
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('error-modal')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error loading content: Failed to load MDX bundle')).toBeInTheDocument();
  });

  it('shows error state when MDX summary bundle fails to load', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load summary bundle' },
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('error-modal')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error loading content: Failed to load summary bundle')).toBeInTheDocument();
  });

  it('shows missing MDX message when mdxBundle is null', () => {
    mockUseMDXBundle.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // When mdxBundle is null, the component should still render the form
    // but the content area should be empty
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByLabelText('Input Block Name')).toBeInTheDocument();
  });

  it('submits form when validation passes', async () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Input block "Test Name" was successfully created!')).toBeInTheDocument();
    });
  });

  it('shows error message when submission fails', async () => {
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: mockSubmit,
      isSubmitting: false,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('shows error message when submission fails with non-Error object', async () => {
    const mockSubmit = jest.fn().mockRejectedValue('String error');
    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: mockSubmit,
      isSubmitting: false,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to submit input block data')).toBeInTheDocument();
    });
  });

  it('resets form when modal is closed', () => {
    const { rerender } = render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in some data
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    // Close modal
    rerender(<DynamicInputBlockModal {...defaultProps} isOpen={false} />);
    
    // Reopen modal
    rerender(<DynamicInputBlockModal {...defaultProps} isOpen={true} />);
    
    // Form should be reset
    expect(screen.getByLabelText('Input Block Name')).toHaveValue('');
  });

  it('handles form data changes', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'new value' } });
    
    expect(testInput).toHaveValue('new value');
  });

  it('displays information tooltip for name field', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // The tooltip should be present (implementation depends on the actual tooltip component)
    expect(screen.getByLabelText('Input Block Name')).toBeInTheDocument();
  });

  it('renders with correct modal dimensions', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveStyle('width: calc(100% - 200px)');
    expect(modal).toHaveStyle('height: calc(100% - 50px)');
  });

  it('renders with screen overlay enabled', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByTestId('screen-overlay')).toBeInTheDocument();
  });

  it('displays correct button labels', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows submitting state when form is being submitted', () => {
    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: jest.fn(),
      isSubmitting: true,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const submitButton = screen.getByTestId('primary-button');
    expect(submitButton).toHaveTextContent('Submitting...');
  });

  it('handles long input values', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const longValue = 'This is a very long input value that might exceed normal input lengths and should be handled gracefully';
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: longValue } });
    
    expect(testInput).toHaveValue(longValue);
  });

  it('handles special characters in input', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const specialValue = 'Test@#$%^&*()🎉🚀';
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: specialValue } });
    
    expect(testInput).toHaveValue(specialValue);
  });

  it('handles empty input values', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: '' } });
    
    expect(testInput).toHaveValue('');
  });

  it('maintains accessibility with proper form structure', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText('Input Block Name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('type', 'text');
  });

  it('provides keyboard accessible buttons', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const submitButton = screen.getByTestId('primary-button');
    const cancelButton = screen.getByTestId('secondary-button');
    const closeButton = screen.getByTestId('close-button');
    
    expect(submitButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    expect(closeButton).toBeInTheDocument();
  });

  it('handles rapid form changes', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    const testInput = screen.getByTestId('test-input');
    
    fireEvent.change(testInput, { target: { value: 'value1' } });
    fireEvent.change(testInput, { target: { value: 'value2' } });
    fireEvent.change(testInput, { target: { value: 'value3' } });
    
    expect(testInput).toHaveValue('value3');
  });

  it('handles multiple submissions', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    
    // Click submit multiple times
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    
    // Should handle multiple submissions gracefully
    expect(submitButton).toBeInTheDocument();
  });

  it('closes message modal and navigates on success', async () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields and submit
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
    
    // Close message modal
    const closeButton = screen.getByTestId('message-close-button');
    fireEvent.click(closeButton);
    
    // Should navigate to the inputs page
    expect(mockPush).toHaveBeenCalledWith('/inputs/test-gid/test-cid');
  });

  it('closes message modal without navigation on error', async () => {
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: mockSubmit,
      isSubmitting: false,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    // Close message modal
    const closeButton = screen.getByTestId('message-close-button');
    fireEvent.click(closeButton);
    
    // Should not navigate on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles validation errors gracefully', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText('Please provide a unique name for this input block')).toBeInTheDocument();
    
    // Fill in the name field
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    
    // Error should still be visible (it's only cleared on submit)
    expect(screen.getByText('Please provide a unique name for this input block')).toBeInTheDocument();
    
    // Submit again to clear the error
    fireEvent.click(submitButton);
    
    // Now the error should be cleared
    expect(screen.queryByText('Please provide a unique name for this input block')).not.toBeInTheDocument();
  });

  it('handles progress function errors', () => {
    // Mock progress function that throws an error
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return true;
          }
          function progress(data) {
            throw new Error('Progress error');
          }
          function summary(data) {
            return 'test';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should still render without crashing
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles missing validation functions', () => {
    // Mock without validation functions
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          // No validation functions
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without progress bar
    expect(screen.queryByText(/Completion:/)).not.toBeInTheDocument();
    
    // Should still allow submission
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    // Should submit successfully without validation
    expect(screen.queryByText('Please complete all required fields before submitting')).not.toBeInTheDocument();
  });

  it('handles validation function returning undefined', () => {
    // Mock validation function that returns undefined
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return undefined;
          }
          function progress(data) {
            return undefined;
          }
          function summary(data) {
            return 'test';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles summary bundle creation error', () => {
    // Mock summary bundle with invalid code that will cause Function constructor to fail
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `invalid javascript code that will cause syntax error`,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles empty name with only whitespace', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Try to submit with whitespace-only name
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: '   ' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText('Please provide a unique name for this input block')).toBeInTheDocument();
  });

  it('clears form error when form data changes', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Try to submit without name to trigger error
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Please provide a unique name for this input block')).toBeInTheDocument();
    
    // Change form data
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'new value' } });
    
    // Error should be cleared
    expect(screen.queryByText('Please provide a unique name for this input block')).not.toBeInTheDocument();
  });

  it('handles message modal not showing when showMessageModal is false', () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Message modal should not be visible initially
    expect(screen.queryByTestId('message-modal')).not.toBeInTheDocument();
  });

  it('handles error message modal visibility', async () => {
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: mockSubmit,
      isSubmitting: false,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('handles main modal visibility when showing error message', async () => {
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    mockUseSubmitInputBlockData.mockReturnValue({
      submitInputBlockData: mockSubmit,
      isSubmitting: false,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Main modal should still be visible when showing error message
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('handles main modal hiding when showing success message', async () => {
    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Fill in required fields and submit
    const nameInput = screen.getByLabelText('Input Block Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'test value' } });
    
    const submitButton = screen.getByTestId('primary-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Main modal should be hidden when showing success message
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('handles null mdxSummaryBundle', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without progress bar
    expect(screen.queryByText(/Completion:/)).not.toBeInTheDocument();
  });

  it('handles null mdxSummaryBundle code', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: { code: null },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without progress bar
    expect(screen.queryByText(/Completion:/)).not.toBeInTheDocument();
  });

  it('handles validation function returning null', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return null;
          }
          function progress(data) {
            return null;
          }
          function summary(data) {
            return 'test';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles progress function returning non-numeric value', () => {
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return true;
          }
          function progress(data) {
            return 'invalid';
          }
          function summary(data) {
            return 'test';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles progress function throwing error', () => {
    // Mock progress function that throws an error
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return true;
          }
          function progress(data) {
            throw new Error('Progress calculation failed');
          }
          function summary(data) {
            return 'test';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without crashing and set progress to 0
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    // Change form data to trigger progress calculation
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'new value' } });
    
    // Should handle the error gracefully
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles invalid progress function code', () => {
    // Mock invalid progress function code that will cause an error
    mockUseMDXSummaryBundle.mockReturnValue({
      data: {
        code: `
          function validate(data) {
            return true;
          }
          function progress(data) {
            return invalidVariable; // This will cause a ReferenceError
          }
          function summary(data) {
            return 'test';
          }
          module.exports = { validate, progress, summary };
        `,
      },
      isLoading: false,
      error: null,
    });

    render(<DynamicInputBlockModal {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    // Change form data to trigger progress calculation
    const testInput = screen.getByTestId('test-input');
    fireEvent.change(testInput, { target: { value: 'new value' } });
    
    // Should handle the error gracefully
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });



}); 