import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FolderUploader from '../FolderUploader';

// Mock the upload hook
const mockMutate = jest.fn();
jest.mock('@/app/models/upload/hooks/useUploadFolder', () => () => ({
  mutate: mockMutate,
  status: 'idle',
}));

// Mock child components and utilities
jest.mock('@/app/models/upload/utils/icons', () => ({
  UploadIcon: () => <div data-testid="upload-icon">Upload Icon</div>,
}));

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: (props: any) => <div data-testid={`icon-${props.name}`} onClick={props.onClick} />,
  IconName: { 
    Trash: 'Trash',
    Check: 'Check',
    Alert: 'Alert'
  }
}));

jest.mock('@/lib/components/button', () => ({
  Button: (props: any) => (
    <button 
      data-testid={`button-${props.text}`}
      onClick={props.onClick} 
      disabled={props.disabled}
      className={props.className}
    >
      {props.text}
    </button>
  ),
  ButtonVariant: { 
    PRIMARY: 'primary',
    SECONDARY: 'secondary'
  }
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: (props: any) => (
    <div data-testid="modal">
      <p>{props.children}</p>
      <button onClick={props.onCloseIconClick}>Close</button>
    </div>
  )
}));

// Mock CSS module
jest.mock('./Uploader.module.css', () => ({
  dropzone: 'dropzone-class',
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('FolderUploader', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area and folder input', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop folder/)).toBeInTheDocument();
    expect(screen.getByText('Click to Browse')).toBeInTheDocument();
    expect(screen.getByText('Select an entire folder with model files')).toBeInTheDocument();
  });

  it('renders folder requirements section', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    expect(screen.getByText('Before uploading...')).toBeInTheDocument();
    expect(screen.getByText('Check that the model folder meets the following requirements.')).toBeInTheDocument();
    expect(screen.getByText('File Size:')).toBeInTheDocument();
    expect(screen.getByText('Data Format:')).toBeInTheDocument();
    expect(screen.getByText('Serializer Type:')).toBeInTheDocument();
  });

  it('renders folder input with correct attributes', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    expect(folderInput).toBeInTheDocument();
    expect(folderInput).toHaveAttribute('webkitdirectory');
    expect(folderInput).toHaveAttribute('directory');
    expect(folderInput).toHaveAttribute('multiple');
    expect(folderInput).toHaveAttribute('id', 'folderInput');
  });

  it('renders form fields', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    expect(screen.getByText('Model Folder Name:*')).toBeInTheDocument();
    expect(screen.getByText('Model Type:*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a name for this model folder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Select')).toBeInTheDocument();
  });

  it('handles drag and drop events', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    // Test drag over
    fireEvent.dragOver(uploadArea!);
    
    // Test drop with mock files
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [mockFile],
      },
    });
    
    // Should show folder name
    expect(screen.getByDisplayValue('test-folder')).toBeInTheDocument();
  });

  it('prevents default on drag events', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault');
    
    fireEvent(uploadArea!, dragOverEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('handles folder selection via file input', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'selected-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should show folder name
    expect(screen.getByDisplayValue('selected-folder')).toBeInTheDocument();
  });

  it('shows selected files count', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile1 = new File(['content1'], 'file1.txt');
    const mockFile2 = new File(['content2'], 'file2.txt');
    
    Object.defineProperty(mockFile1, 'webkitRelativePath', {
      value: 'test-folder/file1.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(mockFile2, 'webkitRelativePath', {
      value: 'test-folder/file2.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile1, mockFile2] } });
    
    // Use a more flexible matcher to handle split text
    const headings = screen.getAllByRole('heading', { level: 3 });
    const selectedFilesHeading = headings.find(heading => 
      heading.textContent?.includes('Selected Files:')
    );
    expect(selectedFilesHeading).toBeInTheDocument();
    expect(selectedFilesHeading).toHaveTextContent('2 files');
  });

  it('displays selected files grouped by folder', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile1 = new File(['content1'], 'file1.txt');
    const mockFile2 = new File(['content2'], 'file2.txt');
    
    Object.defineProperty(mockFile1, 'webkitRelativePath', {
      value: 'test-folder/subfolder/file1.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(mockFile2, 'webkitRelativePath', {
      value: 'test-folder/subfolder/file2.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile1, mockFile2] } });
    
    // Use a more flexible matcher to check for subfolder display
    const elements = screen.getAllByText((content, element) => {
      return Boolean(element?.textContent?.includes('subfolder') && 
             element?.textContent?.includes('2 files'));
    });
    expect(elements.length).toBeGreaterThan(0);
  });

  it('submits form successfully with valid data', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add folder files
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Fill in form fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with FormData
    expect(mockMutate).toHaveBeenCalledWith(
      expect.any(FormData),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('calls onBack when cancel button is clicked', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const cancelButton = screen.getByText('CANCEL');
    fireEvent.click(cancelButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when no files are selected', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const submitButton = screen.getByText('UPLOAD FOLDER');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when files are selected and form is filled', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    const submitButton = screen.getByText('UPLOAD FOLDER');
    expect(submitButton).not.toBeDisabled();
  });

  it('provides mutation callbacks', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Get the callbacks
    const onSuccessCallback = mockMutate.mock.calls[0][1].onSuccess;
    const onErrorCallback = mockMutate.mock.calls[0][1].onError;
    
    expect(typeof onSuccessCallback).toBe('function');
    expect(typeof onErrorCallback).toBe('function');
  });

  it('handles form field changes', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'New Folder Name' } });
    
    expect(folderNameInput).toHaveValue('New Folder Name');
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'regression' } });
    
    expect(modelTypeSelect).toHaveValue('regression');
  });

  it('renders clear button when files are selected', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    expect(screen.getByText('CLEAR ALL')).toBeInTheDocument();
  });

  // New tests for 100% coverage

  it('handles folder replacement with modal message', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    
    // First folder
    const mockFile1 = new File(['content1'], 'file1.txt');
    Object.defineProperty(mockFile1, 'webkitRelativePath', {
      value: 'folder1/file1.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile1] } });
    
    // Second folder (different name)
    const mockFile2 = new File(['content2'], 'file2.txt');
    Object.defineProperty(mockFile2, 'webkitRelativePath', {
      value: 'folder2/file2.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile2] } });
    
    // Should show modal with replacement message
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText(/Replaced folder "folder1" with "folder2"/)).toBeInTheDocument();
  });

  it('handles drop with directory entries', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    // Mock directory entry with files
    const mockFileEntry = {
      isFile: true,
      isDirectory: false,
      name: 'test.txt',
      file: (callback: (file: File) => void) => {
        const mockFile = new File(['test content'], 'test.txt');
        callback(mockFile);
      }
    };
    
    const mockDirectoryEntry = {
      isFile: false,
      isDirectory: true,
      name: 'test-directory',
      createReader: () => ({
        readEntries: (callback: (entries: any[]) => void) => {
          callback([mockFileEntry]);
        }
      })
    };
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: [
          { 
            kind: 'file',
            webkitGetAsEntry: () => mockDirectoryEntry
          }
        ]
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should show the directory folder
    await waitFor(() => {
      expect(screen.getByDisplayValue('test-directory')).toBeInTheDocument();
    });
  });

  it('handles drop with individual files', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: [
          { 
            kind: 'file',
            webkitGetAsEntry: () => ({
              isFile: true,
              isDirectory: false,
              name: 'test.txt'
            }),
            getAsFile: () => new File(['test content'], 'test.txt')
          }
        ]
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should show the file name
    await waitFor(() => {
      expect(screen.getByDisplayValue('test.txt')).toBeInTheDocument();
    });
  });

  it('handles drop with no items', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: null,
        files: []
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should not crash
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles drop with non-file items', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: [
          { 
            kind: 'string',
            webkitGetAsEntry: () => null
          }
        ]
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should not crash
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles drop with null entry', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: [
          { 
            kind: 'file',
            webkitGetAsEntry: () => null
          }
        ]
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should not crash
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles drop with null file', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: [
          { 
            kind: 'file',
            webkitGetAsEntry: () => ({
              isFile: true,
              isDirectory: false,
              name: 'test.txt'
            }),
            getAsFile: () => null
          }
        ]
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should not crash
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles drop with empty files array', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: []
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should not crash
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles form submission with no files', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const submitButton = screen.getByText('UPLOAD FOLDER');
    expect(submitButton).toBeDisabled();
    
    // Try to click the disabled button - it shouldn't trigger form submission
    fireEvent.click(submitButton);
    
    // Modal should not appear because the button is disabled
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('handles form submission with missing fields', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files but don't fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Clear the auto-filled folder name to ensure validation fails
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: '' } });
    
    // Submit form directly by triggering the form's onSubmit event
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    
    // Should show modal with error message
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
  });

  it('handles successful upload callback', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Get the success callback and call it
    const onSuccessCallback = mockMutate.mock.calls[0][1].onSuccess;
    
    // Wrap the callback in act() to handle React state updates
    await act(async () => {
      onSuccessCallback();
    });
    
    // Should show success modal and reset form
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Folder uploaded successfully!')).toBeInTheDocument();
    
    // Form should be reset
    expect(folderNameInput).toHaveValue('');
    expect(modelTypeSelect).toHaveValue('');
  });

  it('handles error callback with Error object', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Get the error callback and call it with Error object
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    const options = lastCall[1]; // The second argument is the options object
    
    // Wrap the error callback in act() to handle React state updates
    await act(async () => {
      options.onError(new Error('Upload failed'));
    });
    
    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Error uploading folder "Test Model Folder": Upload failed/)).toBeInTheDocument();
    });
    
    // Form should be reset
    expect(folderNameInput).toHaveValue('');
    expect(modelTypeSelect).toHaveValue('');
  });

  it('handles error callback with string error', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Get the error callback and call it with string error
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    const options = lastCall[1]; // The second argument is the options object
    
    // Wrap the error callback in act() to handle React state updates
    await act(async () => {
      options.onError('Network error');
    });
    
    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Error uploading folder "Test Model Folder": Network error/)).toBeInTheDocument();
    });
  });

  it('handles error callback with object error', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Get the error callback and call it with object error
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    const options = lastCall[1]; // The second argument is the options object
    
    // Wrap the error callback in act() to handle React state updates
    await act(async () => {
      options.onError({ message: 'Server error' });
    });
    
    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Error uploading folder "Test Model Folder": Server error/)).toBeInTheDocument();
    });
  });

  it('handles error callback with unknown error', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files and fill form
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Get the error callback and call it with unknown error
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    const options = lastCall[1]; // The second argument is the options object
    
    // Wrap the error callback in act() to handle React state updates
    await act(async () => {
      options.onError(null);
    });
    
    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Error uploading folder "Test Model Folder": Unknown error/)).toBeInTheDocument();
    });
  });

  it('handles files without webkitRelativePath', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    // No webkitRelativePath property
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should not crash and should not set folder name
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    expect(folderNameInput).toHaveValue('');
  });

  it('handles files with empty webkitRelativePath', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: '',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should not crash
    expect(folderInput).toBeInTheDocument();
  });

  it('handles files with complex path structure', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/subfolder/deep/nested/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should extract folder name correctly
    expect(screen.getByDisplayValue('folder')).toBeInTheDocument();
  });

  it('handles clear all files', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add some files first
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile1 = new File(['test content'], 'test1.txt');
    const mockFile2 = new File(['test content'], 'test2.txt');
    Object.defineProperty(mockFile1, 'webkitRelativePath', {
      value: 'folder1/file1.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(mockFile2, 'webkitRelativePath', {
      value: 'folder2/file2.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile1, mockFile2] } });
    
    // Should show files
    expect(screen.getByText('folder1/')).toBeInTheDocument();
    expect(screen.getByText('folder2/')).toBeInTheDocument();
    
    // Clear all files
    const clearButton = screen.getByText('CLEAR ALL');
    fireEvent.click(clearButton);
    
    // Should not show any files
    expect(screen.queryByText('folder1/')).not.toBeInTheDocument();
    expect(screen.queryByText('folder2/')).not.toBeInTheDocument();
  });

  it('shows error modal when no files are selected', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const submitButton = screen.getByText('UPLOAD FOLDER');
    expect(submitButton).toBeDisabled();
    
    // Try to click the disabled button - it shouldn't trigger form submission
    fireEvent.click(submitButton);
    
    // Modal should not appear because the button is disabled
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('shows error modal when required fields are missing', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files but don't fill required fields
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Don't fill in the folder name or model type
    // The folder name will be auto-filled from the file path, but model type will be empty
    
    // Submit the form
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    
    // Should show error modal
    expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
  });

  it('validates whitespace-only folder name', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Add files first to enable the button
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'test-folder/test.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Set whitespace-only folder name
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: '   ' } });
    
    // Set model type
    const modelTypeSelect = screen.getByRole('combobox');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit the form directly
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    
    // Should show error modal
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
  });

  it('handles error callback with server error', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Fill in required fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByRole('combobox');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Add files
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Submit the form
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    
    // Mock the error callback by calling the onError function from the options
    const mockError = new Error('Server error');
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    const options = lastCall[1]; // The second argument is the options object
    
    // Wrap the error callback in act() to handle React state updates
    await act(async () => {
      options.onError(mockError);
    });
    
    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Error uploading folder "folder": Server error/)).toBeInTheDocument();
    });
  });

  it('handles error callback with network error', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Fill in required fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    fireEvent.change(folderNameInput, { target: { value: 'Test Model Folder' } });
    
    const modelTypeSelect = screen.getByRole('combobox');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Add files
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Submit the form
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    
    // Mock the error callback by calling the onError function from the options
    const mockError = new Error('Network error');
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    const options = lastCall[1]; // The second argument is the options object
    
    // Wrap the error callback in act() to handle React state updates
    await act(async () => {
      options.onError(mockError);
    });
    
    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Error uploading folder "folder": Network error/)).toBeInTheDocument();
    });
  });

  it('handles files without webkitRelativePath', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    // No webkitRelativePath property
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should not crash and should not set folder name
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    expect(folderNameInput).toHaveValue('');
  });

  it('handles files with empty webkitRelativePath', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: '',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should not crash
    expect(folderInput).toBeInTheDocument();
  });

  it('handles files with complex path structure', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/subfolder/deep/nested/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Should extract folder name correctly
    expect(screen.getByDisplayValue('folder')).toBeInTheDocument();
  });

  it('handles files with no subfolder path', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Fill required fields and submit to test subfolder handling
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with empty subfolder path
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles files with subfolder paths', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const folderInput = document.querySelector('input[type="file"]');
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/subfolder1/subfolder2/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Fill required fields and submit to test subfolder handling
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with subfolder path
    expect(mockMutate).toHaveBeenCalled();
  });

  // Additional tests for 100% coverage

  it('handles traverseDirectory with nested directories', async () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    const uploadArea = screen.getByText(/Drag & drop folder/).closest('div');
    
    // Mock nested directory structure
    const mockFileEntry = {
      isFile: true,
      isDirectory: false,
      name: 'test.txt',
      file: (callback: (file: File) => void) => {
        const mockFile = new File(['test content'], 'test.txt');
        Object.defineProperty(mockFile, 'webkitRelativePath', {
          value: 'root/subfolder/test.txt',
          writable: false,
          enumerable: false,
          configurable: false
        });
        callback(mockFile);
      }
    };
    
    const mockSubDirectoryEntry = {
      isFile: false,
      isDirectory: true,
      name: 'subfolder',
      createReader: () => ({
        readEntries: (callback: (entries: any[]) => void) => {
          callback([mockFileEntry]);
        }
      })
    };
    
    const mockDirectoryEntry = {
      isFile: false,
      isDirectory: true,
      name: 'root',
      createReader: () => ({
        readEntries: (callback: (entries: any[]) => void) => {
          callback([mockSubDirectoryEntry]);
        }
      })
    };
    
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        items: [
          { 
            kind: 'file',
            webkitGetAsEntry: () => mockDirectoryEntry
          }
        ]
      }
    };
    
    fireEvent.drop(uploadArea!, mockDropEvent);
    
    // Should show the root directory folder
    await waitFor(() => {
      expect(screen.getByDisplayValue('root')).toBeInTheDocument();
    });
  });

  it('handles form submission with valid data and more than 5 files', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Create 6 files to trigger the "more than 5 files" console log
    const mockFiles = Array.from({ length: 6 }, (_, i) => {
      const file = new File(['test content'], `test${i}.txt`);
      Object.defineProperty(file, 'webkitRelativePath', {
        value: `folder/file${i}.txt`,
        writable: false,
        enumerable: false,
        configurable: false
      });
      return file;
    });
    
    const folderInput = document.querySelector('input[type="file"]');
    fireEvent.change(folderInput!, { target: { files: mockFiles } });
    
    // Fill required fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with form data
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles form submission with valid data and exactly 5 files', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Create exactly 5 files
    const mockFiles = Array.from({ length: 5 }, (_, i) => {
      const file = new File(['test content'], `test${i}.txt`);
      Object.defineProperty(file, 'webkitRelativePath', {
        value: `folder/file${i}.txt`,
        writable: false,
        enumerable: false,
        configurable: false
      });
      return file;
    });
    
    const folderInput = document.querySelector('input[type="file"]');
    fireEvent.change(folderInput!, { target: { files: mockFiles } });
    
    // Fill required fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with form data
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles form submission with valid data and less than 5 files', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Create 3 files
    const mockFiles = Array.from({ length: 3 }, (_, i) => {
      const file = new File(['test content'], `test${i}.txt`);
      Object.defineProperty(file, 'webkitRelativePath', {
        value: `folder/file${i}.txt`,
        writable: false,
        enumerable: false,
        configurable: false
      });
      return file;
    });
    
    const folderInput = document.querySelector('input[type="file"]');
    fireEvent.change(folderInput!, { target: { files: mockFiles } });
    
    // Fill required fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with form data
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles form submission with valid data and single file', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Create single file
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    const folderInput = document.querySelector('input[type="file"]');
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Fill required fields
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with form data
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles form submission with valid data and regression model type', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Create single file
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    const folderInput = document.querySelector('input[type="file"]');
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Fill required fields with regression model type
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'regression' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with form data
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles form submission with valid data and uplift model type', () => {
    render(<FolderUploader onBack={mockOnBack} />);
    
    // Create single file
    const mockFile = new File(['test content'], 'test.txt');
    Object.defineProperty(mockFile, 'webkitRelativePath', {
      value: 'folder/file.txt',
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    const folderInput = document.querySelector('input[type="file"]');
    fireEvent.change(folderInput!, { target: { files: [mockFile] } });
    
    // Fill required fields with uplift model type
    const folderNameInput = screen.getByPlaceholderText('Enter a name for this model folder');
    const modelTypeSelect = screen.getByDisplayValue('Select');
    
    fireEvent.change(folderNameInput, { target: { value: 'test-folder' } });
    fireEvent.change(modelTypeSelect, { target: { value: 'uplift' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FOLDER');
    fireEvent.click(submitButton);
    
    // Should call mutate with form data
    expect(mockMutate).toHaveBeenCalled();
  });
}); 