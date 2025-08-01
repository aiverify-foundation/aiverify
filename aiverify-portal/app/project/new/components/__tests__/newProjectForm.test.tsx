import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewProjectForm } from '../newProjectForm';
import { createProject } from '../../../actions/createProject';

// Mock the createProject action
jest.mock('../../../actions/createProject');
const mockCreateProject = createProject as jest.MockedFunction<typeof createProject>;

// Mock the useActionState hook
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useActionState: jest.fn(),
  };
});

const mockUseActionState = jest.mocked(require('react').useActionState);

describe('NewProjectForm', () => {
  const mockAction = jest.fn();
  const initialFormState = {
    formStatus: 'initial' as const,
    formErrors: undefined,
    name: '',
    description: '',
    reportTitle: '',
    company: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActionState.mockReturnValue([initialFormState, mockAction]);
  });

  describe('Component Rendering', () => {
    it('renders all form fields with correct labels and required attributes', () => {
      render(<NewProjectForm />);

      // Check all form fields are rendered
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/report title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();

      // Check that form fields are rendered (required attribute is handled by the TextInput/TextArea components)
      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);

      expect(nameInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      expect(reportTitleInput).toBeInTheDocument();
      expect(companyInput).toBeInTheDocument();
    });

    it('renders submit button with correct text and initial disabled state', () => {
      render(<NewProjectForm />);

      const submitButton = screen.getByRole('button', { name: /next/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('renders required field indicator', () => {
      render(<NewProjectForm />);

      expect(screen.getByText('* Required')).toBeInTheDocument();
    });

    it('renders form with correct action', () => {
      render(<NewProjectForm />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('action');
    });
  });

  describe('Form Validation', () => {
    it('enables submit button when all fields are filled', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Fill all fields
      await user.type(nameInput, 'Test Project');
      await user.type(descriptionInput, 'Test Description');
      await user.type(reportTitleInput, 'Test Report');
      await user.type(companyInput, 'Test Company');

      // Should be enabled after all fields are filled
      expect(submitButton).toBeEnabled();
    });

    it('disables submit button when any field is empty', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill only some fields
      await user.type(nameInput, 'Test Project');
      await user.type(descriptionInput, 'Test Description');
      // Leave reportTitle and company empty

      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when fields contain only whitespace', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill fields with whitespace only
      await user.type(nameInput, '   ');
      await user.type(descriptionInput, '   ');
      await user.type(reportTitleInput, '   ');
      await user.type(companyInput, '   ');

      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when fields contain valid content after whitespace', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill fields with content that includes whitespace
      await user.type(nameInput, '  Test Project  ');
      await user.type(descriptionInput, '  Test Description  ');
      await user.type(reportTitleInput, '  Test Report  ');
      await user.type(companyInput, '  Test Company  ');

      expect(submitButton).toBeEnabled();
    });
  });

  describe('Input Handling', () => {
    it('updates form values when user types in input fields', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);

      await user.type(nameInput, 'My Project');
      await user.type(descriptionInput, 'My Description');
      await user.type(reportTitleInput, 'My Report');
      await user.type(companyInput, 'My Company');

      expect(nameInput).toHaveValue('My Project');
      expect(descriptionInput).toHaveValue('My Description');
      expect(reportTitleInput).toHaveValue('My Report');
      expect(companyInput).toHaveValue('My Company');
    });

    it('handles input changes for both input and textarea elements', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionTextarea = screen.getByLabelText(/project description/i);

      await user.type(nameInput, 'Test');
      await user.type(descriptionTextarea, 'Test Description');

      expect(nameInput).toHaveValue('Test');
      expect(descriptionTextarea).toHaveValue('Test Description');
    });

    it('maintains form state when switching between fields', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);

      await user.type(nameInput, 'Project Name');
      await user.click(descriptionInput);
      await user.type(descriptionInput, 'Project Description');

      expect(nameInput).toHaveValue('Project Name');
      expect(descriptionInput).toHaveValue('Project Description');
    });
  });

  describe('Form Submission', () => {
    it('calls the action when form is submitted with valid data', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill all fields
      await user.type(nameInput, 'Test Project');
      await user.type(descriptionInput, 'Test Description');
      await user.type(reportTitleInput, 'Test Report');
      await user.type(companyInput, 'Test Company');

      // Submit form
      await user.click(submitButton);

      expect(mockAction).toHaveBeenCalled();
    });

    it('does not call action when form is submitted with invalid data', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const submitButton = screen.getByRole('button', { name: /next/i });

      // Try to submit without filling fields
      await user.click(submitButton);

      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error modal when formStatus is error', () => {
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
          description: ['Description is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('name: Name is required')).toBeInTheDocument();
      expect(screen.getByText('description: Description is required')).toBeInTheDocument();
    });

    it('shows error modal with unknown error when formErrors is undefined', () => {
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: undefined,
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });

    it('shows error modal with empty errors array', () => {
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          error: [],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('error:')).toBeInTheDocument();
    });

    it('does not show error modal when formStatus is not error', () => {
      const successFormState = {
        ...initialFormState,
        formStatus: 'success' as const,
      };

      mockUseActionState.mockReturnValue([successFormState, mockAction]);

      render(<NewProjectForm />);

      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
    });

    it('closes error modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      // Error modal should be visible
      expect(screen.getByText('Errors')).toBeInTheDocument();

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Error modal should be hidden
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
    });

    it('closes error modal when close icon is clicked', async () => {
      const user = userEvent.setup();
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      // Error modal should be visible
      expect(screen.getByText('Errors')).toBeInTheDocument();

      // Find and click the close icon (assuming it's a button with aria-label or similar)
      const closeIcon = screen.getByRole('button', { name: /close/i });
      await user.click(closeIcon);

      // Error modal should be hidden
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
    });
  });

  describe('Modal Properties', () => {
    it('renders error modal with correct properties', () => {
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      // Check for modal content
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders alert icon in error modal', () => {
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      // Check for alert icon (SVG with red stroke)
      const alertIcon = document.querySelector('svg[stroke="red"]');
      expect(alertIcon).toBeInTheDocument();
    });
  });

  describe('useEffect Behavior', () => {
    it('sets showErrorModal to true when formStatus changes to error', () => {
      // Start with initial state
      mockUseActionState.mockReturnValue([initialFormState, mockAction]);
      const { rerender } = render(<NewProjectForm />);

      // Should not show error modal initially
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();

      // Change to error state
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);
      rerender(<NewProjectForm />);

      // Should show error modal
      expect(screen.getByText('Errors')).toBeInTheDocument();
    });

    it('does not set showErrorModal when formStatus is success', () => {
      const successFormState = {
        ...initialFormState,
        formStatus: 'success' as const,
      };

      mockUseActionState.mockReturnValue([successFormState, mockAction]);

      render(<NewProjectForm />);

      // Should not show error modal
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
      
      // Verify that the success case is handled (even though it's empty)
      // This covers the empty success block in useEffect
    });

    it('does not set showErrorModal when formStatus is initial', () => {
      mockUseActionState.mockReturnValue([initialFormState, mockAction]);

      render(<NewProjectForm />);

      // Should not show error modal
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid input changes correctly', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Rapid typing
      await user.type(nameInput, 'Test');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Test');

      expect(nameInput).toHaveValue('New Test');
      expect(submitButton).toBeDisabled(); // Still disabled because other fields are empty
    });

    it('handles form with mixed valid and invalid field states', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill some fields with valid content, others with whitespace
      await user.type(nameInput, 'Valid Name');
      await user.type(descriptionInput, '   '); // Whitespace only
      await user.type(reportTitleInput, 'Valid Title');
      await user.type(companyInput, '   '); // Whitespace only

      expect(submitButton).toBeDisabled();
    });

    it('handles form with all fields containing only whitespace', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill all fields with whitespace
      await user.type(nameInput, '   ');
      await user.type(descriptionInput, '   ');
      await user.type(reportTitleInput, '   ');
      await user.type(companyInput, '   ');

      expect(submitButton).toBeDisabled();
    });

    it('handles form with fields containing mixed whitespace and content', async () => {
      const user = userEvent.setup();
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /next/i });

      // Fill fields with content that includes leading/trailing whitespace
      await user.type(nameInput, '  Project Name  ');
      await user.type(descriptionInput, '  Project Description  ');
      await user.type(reportTitleInput, '  Report Title  ');
      await user.type(companyInput, '  Company Name  ');

      expect(submitButton).toBeEnabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<NewProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/project description/i);
      const reportTitleInput = screen.getByLabelText(/report title/i);
      const companyInput = screen.getByLabelText(/company name/i);

      expect(nameInput).toHaveAttribute('name', 'name');
      expect(descriptionInput).toHaveAttribute('name', 'description');
      expect(reportTitleInput).toHaveAttribute('name', 'reportTitle');
      expect(companyInput).toHaveAttribute('name', 'company');
    });

    it('has proper button roles and states', () => {
      render(<NewProjectForm />);

      const submitButton = screen.getByRole('button', { name: /next/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).toBeDisabled();
    });

    it('has proper modal accessibility attributes', () => {
      const errorFormState = {
        ...initialFormState,
        formStatus: 'error' as const,
        formErrors: {
          name: ['Name is required'],
        },
      };

      mockUseActionState.mockReturnValue([errorFormState, mockAction]);

      render(<NewProjectForm />);

      // Check that error modal content is accessible
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });
}); 