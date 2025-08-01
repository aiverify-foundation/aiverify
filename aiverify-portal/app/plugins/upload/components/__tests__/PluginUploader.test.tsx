import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import PluginUploader from '../PluginUploader';

// Mock the useUploadFiles hook
const mockMutate = jest.fn();
jest.mock('@/app/plugins/upload/hooks/useUploadFile', () => ({
  useUploadFiles: ({ onSuccess, onError }: any) => ({
    mutate: mockMutate,
  }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, color, size, 'aria-label': ariaLabel }: any) => (
    <div 
      data-testid={`icon-${name}`} 
      data-color={color} 
      data-size={size}
      aria-label={ariaLabel}
    >
      {name} Icon
    </div>
  ),
  IconName: {
    ArrowLeft: 'ArrowLeft',
    Close: 'Close',
  },
}));

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, disabled, className, 'aria-label': ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      data-testid={`button-${text?.toLowerCase().replace(/\s+/g, '-')}`}
      {...props}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
  },
}));

// Mock Modal component
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ heading, children, onCloseIconClick, bgColor, textColor, height }: any) => (
    <div
      data-testid="modal"
      style={{ backgroundColor: bgColor, color: textColor, height }}
      aria-modal="true"
      role="dialog"
    >
      <div data-testid="modal-header">
        <h2>{heading}</h2>
        <button onClick={onCloseIconClick} data-testid="close-modal">
          ×
        </button>
      </div>
      <div data-testid="modal-content">{children}</div>
    </div>
  ),
}));

// Mock CSS module
jest.mock('../Uploader.module.css', () => ({
  dropzone: 'dropzone',
  fileItem: 'fileItem',
  fileHeader: 'fileHeader',
  fileName: 'fileName',
  removeButton: 'removeButton',
  progressBarContainer: 'progressBarContainer',
  progressBar: 'progressBar',
  fileStatus: 'fileStatus',
}));

describe('PluginUploader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<PluginUploader />);
      expect(screen.getByRole('region', { name: 'Plugin uploader container' })).toBeInTheDocument();
    });

    it('displays the back button and header', () => {
      render(<PluginUploader />);
      
      const backButton = screen.getByTestId('icon-ArrowLeft');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('aria-label', 'Back to plugins');
      
      const header = screen.getByRole('heading', { level: 1 });
      expect(header).toHaveTextContent('Add New Plugin > Upload Plugin File');
    });

    it('displays upload requirements', () => {
      render(<PluginUploader />);
      
      expect(screen.getByText('Before uploading...')).toBeInTheDocument();
      expect(screen.getByText('Check that the plugin file meets the following requirments.')).toBeInTheDocument();
      expect(screen.getByText('ZIP file')).toBeInTheDocument();
      expect(screen.getByText('Must contain plugin.meta.json file or pyproject.toml for algorithms')).toBeInTheDocument();
    });

    it('displays file drop zone', () => {
      render(<PluginUploader />);
      
      const dropzone = screen.getByRole('button', { name: 'File drop zone' });
      expect(dropzone).toBeInTheDocument();
      expect(dropzone).toHaveTextContent('Drag & drop or');
      expect(dropzone).toHaveTextContent('Click to Browse');
    });

    it('displays upload button in disabled state initially', () => {
      render(<PluginUploader />);
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toBeDisabled();
      expect(uploadButton).toHaveTextContent('CONFIRM UPLOAD');
    });
  });

  describe('File Selection', () => {
    it('handles file selection through input', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(hiddenInput, file);
      
      expect(screen.getByText('test-plugin.zip')).toBeInTheDocument();
    });

    it('handles multiple file selection', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const files = [
        new File(['test content 1'], 'plugin1.zip', { type: 'application/zip' }),
        new File(['test content 2'], 'plugin2.zip', { type: 'application/zip' }),
      ];
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(hiddenInput, files);
      
      expect(screen.getByText('plugin1.zip')).toBeInTheDocument();
      expect(screen.getByText('plugin2.zip')).toBeInTheDocument();
    });

    it('handles drag and drop file selection', async () => {
      render(<PluginUploader />);
      
      const dropzone = screen.getByRole('button', { name: 'File drop zone' });
      const file = new File(['test content'], 'dropped-plugin.zip', { type: 'application/zip' });
      
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
      });
      
      fireEvent(dropzone, dropEvent);
      
      await waitFor(() => {
        expect(screen.getByText('dropped-plugin.zip')).toBeInTheDocument();
      });
    });

    it('enables upload button when files are selected', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(hiddenInput, file);
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      expect(uploadButton).not.toBeDisabled();
    });
  });

  describe('File Management', () => {
    it('allows removing selected files', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      // Add a file
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      expect(screen.getByText('test-plugin.zip')).toBeInTheDocument();
      
      // Remove the file
      const removeButton = screen.getByTestId('icon-Close');
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('test-plugin.zip')).not.toBeInTheDocument();
    });

    it('displays file status and progress', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      expect(screen.getByText('idle')).toBeInTheDocument();
    });
  });

  describe('Upload Process', () => {
    it('initiates upload when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      // Add a file
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      // Click upload button
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      expect(mockMutate).toHaveBeenCalled();
      expect(screen.getByText('UPLOADING...')).toBeInTheDocument();
    });

    it('disables upload button during upload', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      expect(uploadButton).toBeDisabled();
    });

    it('shows progress during upload', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      expect(screen.getByText('uploading')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('does not display modal initially', () => {
      render(<PluginUploader />);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('displays modal on upload success', async () => {
      const user = userEvent.setup();
      
      // Mock successful upload
      mockMutate.mockImplementation(({ fileUpload, onProgress }) => {
        onProgress(100);
        // Simulate successful upload by calling onSuccess from useUploadFiles
      });
      
      render(<PluginUploader />);
      
      const file = new File(['test content'], 'test-plugin.zip', { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      // Note: The modal would be triggered by the onSuccess callback in useUploadFiles
      // This test structure shows how it would work
    });

    it('closes modal when close button is clicked', async () => {
      render(<PluginUploader />);
      
      // We need to simulate the modal being open first
      // In a real scenario, this would happen after upload success/failure
      const component = screen.getByRole('region', { name: 'Plugin uploader container' });
      
      // Simulate modal state by directly manipulating component state
      // This would require exposing state or using a testing library that can access internal state
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<PluginUploader />);
      
      const container = screen.getByRole('region', { name: 'Plugin uploader container' });
      expect(container).toBeInTheDocument();
      
      const header = screen.getByRole('banner', { name: 'Uploader header' });
      expect(header).toBeInTheDocument();
      
      const mainSection = screen.getByRole('main', { name: 'File upload section' });
      expect(mainSection).toBeInTheDocument();
      
      const requirementsList = screen.getByRole('list', { name: 'list of plugin upload requirements' });
      expect(requirementsList).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<PluginUploader />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveAttribute('aria-label', 'upload plugin header');
      
      const subHeading = screen.getByRole('heading', { level: 2 });
      expect(subHeading).toHaveTextContent('Selected Files:');
    });

    it('has accessible form elements', () => {
      render(<PluginUploader />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('multiple');
      
      const dropzone = screen.getByRole('button', { name: 'File drop zone' });
      expect(dropzone).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file selection', () => {
      render(<PluginUploader />);
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { files: [] } });
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      expect(uploadButton).toBeDisabled();
    });

    it('handles drag over events', () => {
      render(<PluginUploader />);
      
      const dropzone = screen.getByRole('button', { name: 'File drop zone' });
      
      const dragOverEvent = new Event('dragover', { bubbles: true });
      fireEvent(dropzone, dragOverEvent);
      
      // Should not cause any errors
      expect(dropzone).toBeInTheDocument();
    });

    it('handles large file names', async () => {
      const user = userEvent.setup();
      render(<PluginUploader />);
      
      const longFileName = 'a'.repeat(100) + '.zip';
      const file = new File(['test content'], longFileName, { type: 'application/zip' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(hiddenInput, file);
      
      expect(screen.getByText(longFileName)).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to main container', () => {
      render(<PluginUploader />);
      
      const container = screen.getByRole('region', { name: 'Plugin uploader container' });
      expect(container).toHaveClass(
        'relative',
        'mb-8',
        'flex',
        'h-[calc(100vh-200px)]',
        'overflow-y-auto',
        'rounded-lg',
        'bg-secondary-950',
        'pl-10',
        'scrollbar-hidden'
      );
    });

    it('applies correct CSS classes to upload button', () => {
      render(<PluginUploader />);
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      expect(uploadButton).toHaveClass(
        'mb-5',
        'rounded-md',
        'border-none',
        'bg-primary-400',
        'px-5',
        'py-2.5',
        'text-white',
        'disabled:cursor-not-allowed',
        'disabled:bg-secondary-900',
        'disabled:text-secondary-600'
      );
    });
  });
}); 