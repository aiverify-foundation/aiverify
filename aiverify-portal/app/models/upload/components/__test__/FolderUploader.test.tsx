import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    
    expect(screen.getByText('Selected Files: (2 files)')).toBeInTheDocument();
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
    
    expect(screen.getByText('test-folder/subfolder/ (2 files)')).toBeInTheDocument();
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
}); 