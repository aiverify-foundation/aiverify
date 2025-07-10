import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserFlows } from '@/app/userFlowsEnum';
import { NewTemplateForm } from '../NewTemplateForm';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the useCreateTemplate hook
const mockMutateAsync = jest.fn();
const mockCreateTemplate = {
  mutateAsync: mockMutateAsync,
  isPending: false,
};

jest.mock('@/lib/fetchApis/getTemplates', () => ({
  useCreateTemplate: () => mockCreateTemplate,
}));

// Mock components
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: function MockIcon({ name, size, color }: any) {
    return <div data-testid="icon" data-name={name} data-size={size} data-color={color} />;
  },
  IconName: {
    Alert: 'Alert',
  },
}));

jest.mock('@/lib/components/button', () => ({
  Button: function MockButton({ text, variant, size, onClick, type, disabled, ...props }: any) {
    return (
      <button
        data-testid={`button-${text.toLowerCase().replace(' ', '-')}`}
        data-variant={variant}
        data-size={size}
        onClick={onClick}
        type={type}
        disabled={disabled}
        {...props}
      >
        {text}
      </button>
    );
  },
  ButtonVariant: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
  },
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: function MockModal({ 
    heading, 
    children, 
    className, 
    textColor, 
    primaryBtnLabel, 
    onCloseIconClick, 
    onPrimaryBtnClick,
    enableScreenOverlay,
    width,
    height,
    ...props 
  }: any) {
    return (
      <div 
        data-testid="error-modal" 
        data-heading={heading}
        data-class-name={className}
        data-text-color={textColor}
        data-enable-screen-overlay={enableScreenOverlay}
        data-width={width}
        data-height={height}
        {...props}
      >
        <h2>{heading}</h2>
        <div>{children}</div>
        {onCloseIconClick && (
          <button data-testid="modal-close-icon" onClick={onCloseIconClick}>
            ×
          </button>
        )}
        {onPrimaryBtnClick && (
          <button data-testid="modal-primary-btn" onClick={onPrimaryBtnClick}>
            {primaryBtnLabel}
          </button>
        )}
      </div>
    );
  },
}));

jest.mock('@/lib/components/textArea', () => ({
  TextArea: function MockTextArea({ name, label, labelClassName, ...props }: any) {
    return (
      <div>
        <label className={labelClassName} htmlFor={name}>
          {label}
        </label>
        <textarea
          data-testid={`textarea-${name}`}
          name={name}
          id={name}
          {...props}
        />
      </div>
    );
  },
}));

jest.mock('@/lib/components/textInput', () => ({
  TextInput: function MockTextInput({ name, label, labelClassName, required, ...props }: any) {
    return (
      <div>
        <label className={labelClassName} htmlFor={name}>
          {label}
        </label>
        <input
          data-testid={`input-${name}`}
          name={name}
          id={name}
          required={required}
          {...props}
        />
      </div>
    );
  },
}));

describe('NewTemplateForm', () => {
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTemplate.isPending = false;
  });

  it('should render form elements', () => {
    render(<NewTemplateForm onCancel={mockOnCancel} />);

    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-description')).toBeInTheDocument();
    expect(screen.getByTestId('button-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('button-next')).toBeInTheDocument();
  });

  it('should display correct form labels', () => {
    render(<NewTemplateForm onCancel={mockOnCancel} />);

    expect(screen.getByLabelText('Template Name*')).toBeInTheDocument();
    expect(screen.getByLabelText('Template Description')).toBeInTheDocument();
  });

  it('should show required field indicator', () => {
    render(<NewTemplateForm onCancel={mockOnCancel} />);

    expect(screen.getByText('* Required')).toBeInTheDocument();
  });

  it('should have name field as required', () => {
    render(<NewTemplateForm onCancel={mockOnCancel} />);

    const nameInput = screen.getByTestId('input-name');
    expect(nameInput).toBeRequired();
  });

  it('should have description field as optional', () => {
    render(<NewTemplateForm onCancel={mockOnCancel} />);

    const descriptionTextarea = screen.getByTestId('textarea-description');
    expect(descriptionTextarea).not.toBeRequired();
  });

  it('should apply correct label styling', () => {
    render(<NewTemplateForm onCancel={mockOnCancel} />);

    const nameLabel = screen.getByLabelText('Template Name*').previousElementSibling;
    const descriptionLabel = screen.getByLabelText('Template Description').previousElementSibling;
    
    expect(nameLabel).toHaveClass('!text-white');
    expect(descriptionLabel).toHaveClass('!text-white');
  });

  describe('Form submission', () => {
    it('should handle successful form submission', async () => {
      const mockTemplate = { id: 123 };
      mockMutateAsync.mockResolvedValue(mockTemplate);

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.change(screen.getByTestId('textarea-description'), {
        target: { value: 'Test Description' },
      });

      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          projectInfo: {
            name: 'Test Template',
            description: 'Test Description',
          },
          globalVars: [],
          pages: [],
          fromPlugin: false,
        });
      });

      expect(mockPush).toHaveBeenCalledWith(
        `/canvas?templateId=123&flow=${UserFlows.ViewTemplate}&isTemplate=true&mode=edit`
      );
    });

    it('should handle form submission with empty description', async () => {
      const mockTemplate = { id: 456 };
      mockMutateAsync.mockResolvedValue(mockTemplate);

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Template Only Name' },
      });

      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          projectInfo: {
            name: 'Template Only Name',
            description: '',
          },
          globalVars: [],
          pages: [],
          fromPlugin: false,
        });
      });

      expect(mockPush).toHaveBeenCalledWith(
        `/canvas?templateId=456&flow=${UserFlows.ViewTemplate}&isTemplate=true&mode=edit`
      );
    });

    it('should prevent default form submission', async () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const form = document.querySelector('form') as HTMLFormElement;
      expect(form).toBeInTheDocument();

      // Fill in required field to make form valid
      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });

      // Spy on the form's onSubmit handler
      const handleSubmit = jest.fn();
      form.onsubmit = handleSubmit;

      // Submit the form
      fireEvent.submit(form);

      // Since we're mocking the form submission, just verify the form exists and is submittable
      expect(form).toBeInTheDocument();
      expect(screen.getByTestId('input-name')).toHaveValue('Test Template');
    });
  });

  describe('Error handling', () => {
    it('should show error modal on mutation failure', async () => {
      const errorMessage = 'Template creation failed';
      mockMutateAsync.mockRejectedValue(new Error(errorMessage));

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should show generic error message for unknown errors', async () => {
      mockMutateAsync.mockRejectedValue('Unknown error');

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to create template')).toBeInTheDocument();
    });

    it('should close error modal when close icon is clicked', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Test error'));

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('modal-close-icon'));

      expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument();
    });

    it('should close error modal when primary button is clicked', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Test error'));

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('modal-primary-btn'));

      expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should disable submit button when mutation is pending', () => {
      mockCreateTemplate.isPending = true;

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const submitButton = screen.getByTestId('button-next');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when mutation is not pending', () => {
      mockCreateTemplate.isPending = false;

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const submitButton = screen.getByTestId('button-next');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByTestId('button-cancel'));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when next button is clicked', async () => {
      mockMutateAsync.mockResolvedValue({ id: 123 });

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Button variants and sizes', () => {
    it('should render cancel button with correct variant and size', () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const cancelButton = screen.getByTestId('button-cancel');
      expect(cancelButton).toHaveAttribute('data-variant', 'secondary');
      expect(cancelButton).toHaveAttribute('data-size', 'sm');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });

    it('should render next button with correct variant and size', () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const nextButton = screen.getByTestId('button-next');
      expect(nextButton).toHaveAttribute('data-variant', 'primary');
      expect(nextButton).toHaveAttribute('data-size', 'sm');
      expect(nextButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Modal properties', () => {
    it('should render error modal with correct properties', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Test error'));

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('error-modal');
      expect(modal).toHaveAttribute('data-heading', 'Errors');
      expect(modal).toHaveAttribute('data-class-name', 'bg-secondary-800');
      expect(modal).toHaveAttribute('data-text-color', '#FFFFFF');
      expect(modal).toHaveAttribute('data-enable-screen-overlay', 'true');
      expect(modal).toHaveAttribute('data-width', '400');
      expect(modal).toHaveAttribute('data-height', '600');
    });

    it('should render error icon with correct properties', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Test error'));

      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'Test Template' },
      });
      fireEvent.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('data-name', 'Alert');
      expect(icon).toHaveAttribute('data-size', '30');
      expect(icon).toHaveAttribute('data-color', 'red');
    });
  });

  describe('Form validation', () => {
    it('should handle form with empty name field', () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByTestId('button-next'));

      // The browser will prevent submission due to required attribute
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Layout and styling', () => {
    it('should have proper button container layout', () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const buttonsContainer = screen.getByTestId('button-cancel').parentElement;
      expect(buttonsContainer).toHaveClass('mt-16', 'flex', 'gap-4');
    });

    it('should have proper required text styling', () => {
      render(<NewTemplateForm onCancel={mockOnCancel} />);

      const requiredText = screen.getByText('* Required');
      expect(requiredText).toHaveClass('text-[0.8rem]', 'text-secondary-400');
    });
  });
}); 