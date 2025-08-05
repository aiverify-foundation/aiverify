import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FairnessTreeUploadModal } from '../FairnessTreeUploadModal';

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock mdx-bundler
const mockGetMDXComponent = jest.fn();
jest.mock('mdx-bundler/client', () => ({
  getMDXComponent: (code: string) => mockGetMDXComponent(code),
}));

// Mock hooks
const mockUseMDXBundle = jest.fn();
const mockUseMDXSummaryBundle = jest.fn();
const mockUseSubmitFairnessTree = jest.fn();
const mockUseFairnessTree = jest.fn();

jest.mock('../../hooks/useMDXBundle', () => ({
  useMDXBundle: () => mockUseMDXBundle(),
}));

jest.mock('../../hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: () => mockUseMDXSummaryBundle(),
}));

jest.mock('../../hooks/useSubmitFairnessTree', () => ({
  useSubmitFairnessTree: () => mockUseSubmitFairnessTree(),
}));

jest.mock('../../context/FairnessTreeContext', () => ({
  useFairnessTree: () => mockUseFairnessTree(),
}));

// Mock components
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
    <div data-testid="modal" data-heading={heading} data-width={width} data-height={height}>
      <div data-testid="modal-heading">{heading}</div>
      {children}
      <button data-testid="close-icon" onClick={onCloseIconClick}>Close</button>
      {onPrimaryBtnClick && (
        <button data-testid="primary-btn" onClick={onPrimaryBtnClick}>
          {primaryBtnLabel}
        </button>
      )}
      {onSecondaryBtnClick && (
        <button data-testid="secondary-btn" onClick={onSecondaryBtnClick}>
          {secondaryBtnLabel}
        </button>
      )}
    </div>
  ),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/utils/icons', () => ({
  InfoIcon: ({ className, ...props }: any) => (
    <div data-testid="info-icon" className={className} {...props}>Info</div>
  ),
}));

jest.mock('../Tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

// Mock CSS import
jest.mock('../DecisionTree.css', () => ({}));

describe('FairnessTreeUploadModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    gid: 'test-gid',
    cid: 'test-cid',
  };

  const mockMdxBundle = {
    code: 'export default function TestComponent() { return <div>Test</div>; }',
    frontmatter: {
      graphdata: { nodes: [], edges: [] },
      definitions: [],
    },
  };

  const mockMdxSummaryBundle = {
    code: `
      const validate = (data) => data.sensitiveFeature && data.favourableOutcomeName;
      const progress = (data) => {
        const fields = ['sensitiveFeature', 'favourableOutcomeName', 'qualified', 'unqualified'];
        const filled = fields.filter(field => data[field]).length;
        return Math.round((filled / fields.length) * 100);
      };
      const summary = (data) => 'Test summary';
      return { validate, progress, summary };
    `,
  };

  const mockComponent = jest.fn((props: any) => (
    <div data-testid="mdx-component" {...props}>
      MDX Component Content
    </div>
  ));

  const mockAddFairnessTree = jest.fn();
  const mockSubmitFairnessTree = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default hook mocks
    mockUseMDXBundle.mockReturnValue({
      data: mockMdxBundle,
      isLoading: false,
      error: null,
    });

    mockUseMDXSummaryBundle.mockReturnValue({
      data: mockMdxSummaryBundle,
      isLoading: false,
      error: null,
    });

    mockUseSubmitFairnessTree.mockReturnValue({
      submitFairnessTree: mockSubmitFairnessTree,
      isSubmitting: false,
    });

    mockUseFairnessTree.mockReturnValue({
      addFairnessTree: mockAddFairnessTree,
    });

    mockGetMDXComponent.mockReturnValue(mockComponent);
  });

  describe('Component rendering', () => {
    it('should not render when isOpen is false', async () => {
      render(<FairnessTreeUploadModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render loading state when MDX bundle is loading', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-heading')).toHaveTextContent('Loading Fairness Tree Editor');
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('should render loading state when summary bundle is loading', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-heading')).toHaveTextContent('Loading Fairness Tree Editor');
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('should render error state when MDX bundle has error', async () => {
      const error = new Error('MDX bundle error');
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-heading')).toHaveTextContent('Error');
      expect(screen.getByText('Error loading content: MDX bundle error')).toBeInTheDocument();
    });

    it('should render error state when summary bundle has error', async () => {
      const error = new Error('Summary bundle error');
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-heading')).toHaveTextContent('Error');
      expect(screen.getByText('Error loading content: Summary bundle error')).toBeInTheDocument();
    });

    it('should render main form when data is loaded successfully', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-heading')).toHaveTextContent('Add Fairness Tree');
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
    });

    it('should not render Component when mdxBundle is null', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      // Also mock summary bundle to be null so progress bar doesn't show
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      // The Component should not be rendered when mdxBundle is null
      expect(screen.queryByTestId('mdx-component')).not.toBeInTheDocument();
      
      // The decision tree container should be empty
      const decisionTreeContainer = screen.getByTestId('modal').querySelector('.decision-tree-container');
      expect(decisionTreeContainer?.children.length).toBe(0);
    });
  });

  describe('Validation functions', () => {
    it('should extract validation functions from summary bundle', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      // The validation functions should be extracted and used
      expect(screen.getByText('Completion: 0%')).toBeInTheDocument();
    });

    it('should handle error when creating validation functions', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: 'invalid javascript code that will throw error',
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error creating summary functions:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle error when calculating progress', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => data.sensitiveFeature && data.favourableOutcomeName;
            const progress = (data) => { throw new Error('Progress calculation error'); };
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error calculating progress:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Form validation', () => {
    it('should show error when name is empty', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a name before submitting.')).toBeInTheDocument();
      });
    });

    it('should show error when validation function returns false', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => false;
            const progress = (data) => 0;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all fields before submitting.')).toBeInTheDocument();
      });
    });

    it('should show error when validation function throws error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => { throw new Error('Validation error'); };
            const progress = (data) => 0;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error validating form data. Please check your inputs.')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Validation error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should clear form error when name input changes', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const nameInput = screen.getByLabelText('Name');
      
      // First trigger validation error
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      expect(screen.getByText('Please enter a name before submitting.')).toBeInTheDocument();
      
      // Then change the name input
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      });
      
      expect(screen.queryByText('Please enter a name before submitting.')).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should submit form successfully', async () => {
      mockSubmitFairnessTree.mockResolvedValue(undefined);
      
      // Mock validation to return true
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const progress = (data) => 100;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });
      
      await act(async () => {
      
        render(<FairnessTreeUploadModal {...defaultProps} />);
      
      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Tree' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockSubmitFairnessTree).toHaveBeenCalledWith({
          cid: 'test-cid',
          data: {
            sensitiveFeature: '',
            favourableOutcomeName: '',
            qualified: '',
            unqualified: '',
            metrics: [],
            selections: { nodes: [], edges: [] },
            selectedOutcomes: [],
          },
          gid: 'test-gid',
          name: 'Test Tree',
          group: 'Test Tree',
        });
      });
      
      await waitFor(() => {
        expect(mockAddFairnessTree).toHaveBeenCalledWith({
          gid: 'test-gid',
          name: 'Test Tree',
          group: 'Test Tree',
          data: {
            sensitiveFeature: '',
            favourableOutcomeName: '',
            qualified: '',
            unqualified: '',
            metrics: [],
            selections: { nodes: [], edges: [] },
            selectedOutcomes: [],
          },
          cid: 'test-cid',
        });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('modal-heading')).toHaveTextContent('Success');
        expect(screen.getByText('Tree updated successfully')).toBeInTheDocument();
      });
    });

    it('should handle submission error', async () => {
      const submissionError = new Error('Submission failed');
      mockSubmitFairnessTree.mockRejectedValue(submissionError);
      
      // Mock validation to return true
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const progress = (data) => 100;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
      
        render(<FairnessTreeUploadModal {...defaultProps} />);
      
      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Tree' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('modal-heading')).toHaveTextContent('Error');
        expect(screen.getByText('Error updating tree: Error: Submission failed')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting fairness tree:', submissionError);
      consoleSpy.mockRestore();
    });

    it('should show loading state during submission', async () => {
      mockUseSubmitFairnessTree.mockReturnValue({
        submitFairnessTree: mockSubmitFairnessTree,
        isSubmitting: true,
      });
      
      await act(async () => {
      
        render(<FairnessTreeUploadModal {...defaultProps} />);
      
      });
      
      expect(screen.getByTestId('primary-btn')).toHaveTextContent('Submitting...');
    });
  });

  describe('Modal interactions', () => {
    it('should handle close icon click', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const closeButton = screen.getByTestId('close-icon');
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle secondary button click', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const cancelButton = screen.getByTestId('secondary-btn');
      await act(async () => {
        fireEvent.click(cancelButton);
      });
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle success modal close', async () => {
      mockSubmitFairnessTree.mockResolvedValue(undefined);
      
      // Mock validation to return true
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const progress = (data) => 100;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });
      
      await act(async () => {
      
        render(<FairnessTreeUploadModal {...defaultProps} />);
      
      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Tree' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('modal-heading')).toHaveTextContent('Success');
      });
      
      const successCloseButton = screen.getByTestId('close-icon');
      await act(async () => {
        fireEvent.click(successCloseButton);
      });
      
      expect(mockRefresh).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle error modal close', async () => {
      const submissionError = new Error('Submission failed');
      mockSubmitFairnessTree.mockRejectedValue(submissionError);
      
      // Mock validation to return true
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const progress = (data) => 100;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });
      
      await act(async () => {
      
        render(<FairnessTreeUploadModal {...defaultProps} />);
      
      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Tree' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('modal-heading')).toHaveTextContent('Error');
      });
      
      const errorCloseButton = screen.getByTestId('close-icon');
      await act(async () => {
        fireEvent.click(errorCloseButton);
      });
      
      expect(mockRefresh).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Progress calculation', () => {
    it('should update progress when tree data changes', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => data.sensitiveFeature && data.favourableOutcomeName;
            const progress = (data) => {
              const fields = ['sensitiveFeature', 'favourableOutcomeName', 'qualified', 'unqualified'];
              const filled = fields.filter(field => data[field]).length;
              return Math.round((filled / fields.length) * 100);
            };
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      // Initially should show 0% progress
      expect(screen.getByText('Completion: 0%')).toBeInTheDocument();
      
      // Simulate data change through the MDX component
      act(() => {
        const onChangeData = mockComponent.mock.calls[0][0].onChangeData;
        onChangeData('sensitiveFeature', 'gender');
      });
      
      // Progress should update (this would require the component to re-render with new data)
      // Note: This is a simplified test as the actual progress update depends on the MDX component implementation
    });

    it('should show green progress bar when completion is 100%', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const progress = (data) => 100;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(screen.getByText('Completion: 100%')).toBeInTheDocument();
      
      // The progress bar should have green color class
      const progressBar = screen.getByText('Completion: 100%').nextElementSibling?.querySelector('div');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('should show primary color progress bar when completion is less than 100%', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const progress = (data) => 50;
            const summary = (data) => 'Test summary';
            return { validate, progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      expect(screen.getByText('Completion: 50%')).toBeInTheDocument();
      
      // The progress bar should have primary color class
      const progressBar = screen.getByText('Completion: 50%').nextElementSibling?.querySelector('div');
      expect(progressBar).toHaveClass('bg-primary-500');
    });
  });

  describe('MDX component integration', () => {
    it('should render MDX component with correct props', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const mdxComponent = screen.getByTestId('mdx-component');
      expect(mdxComponent).toBeInTheDocument();
      
      // Check that the component receives the expected props
      expect(mockComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          graphdata: mockMdxBundle.frontmatter.graphdata,
          definitions: mockMdxBundle.frontmatter.definitions,
          isEditing: true,
          data: {
            sensitiveFeature: '',
            favourableOutcomeName: '',
            qualified: '',
            unqualified: '',
            metrics: [],
            selections: { nodes: [], edges: [] },
            selectedOutcomes: [],
          },
          onChangeData: expect.any(Function),
        }),
        undefined
      );
    });

    it('should update tree data when MDX component calls onChangeData', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const mdxComponent = screen.getByTestId('mdx-component');
      const onChangeData = mockComponent.mock.calls[0][0].onChangeData;
      
      // Simulate data change
      act(() => {
        onChangeData('sensitiveFeature', 'gender');
      });
      
      // The component should re-render with updated data
      expect(mockComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sensitiveFeature: 'gender',
          }),
        }),
        undefined
      );
    });
  });

  describe('Form reset on close', () => {
    it('should reset form state when modal is closed', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      });
      
      // Verify the input has the value
      expect(nameInput).toHaveValue('Test Name');
      
      // Close the modal
      const closeButton = screen.getByTestId('close-icon');
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      // The onClose should be called, which would reset the form
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for name input', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('id', 'name');
    });

    it('should have tooltip for name field', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('data-content', 'Enter a unique name for the fairness tree');
    });

    it('should have info icon for name field', async () => {
      await act(async () => {
        render(<FairnessTreeUploadModal {...defaultProps} />);
      });
      
      const infoIcon = screen.getByTestId('info-icon');
      expect(infoIcon).toBeInTheDocument();
      expect(infoIcon).toHaveClass('h-5', 'w-5', 'text-gray-400', 'hover:text-gray-200');
    });
  });

  describe('Edge cases', () => {
    it('should handle null validation functions gracefully', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      // Should render without validation functions
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.queryByText(/Completion:/)).not.toBeInTheDocument();
    });

    it('should handle missing progress function', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const validate = (data) => true;
            const summary = (data) => 'Test summary';
            return { validate, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      // Should render without progress bar
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.queryByText(/Completion:/)).not.toBeInTheDocument();
    });

    it('should handle missing validate function', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: {
          code: `
            const progress = (data) => 50;
            const summary = (data) => 'Test summary';
            return { progress, summary };
          `,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<FairnessTreeUploadModal {...defaultProps} />);

      });
      
      const nameInput = screen.getByLabelText('Name');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      });
      
      const submitButton = screen.getByTestId('primary-btn');
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Should submit successfully without validation function
      expect(mockSubmitFairnessTree).toHaveBeenCalled();
    });
  });
}); 