import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUploader from '../FileUploader';

// Mock the upload hook
const mockMutate = jest.fn();
jest.mock('@/app/models/upload/hooks/useUploadFile', () => () => ({
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
  ButtonVariant: { PRIMARY: 'primary' }
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
  uploadArea: 'upload-area-class',
  dragOver: 'drag-over-class',
  fileList: 'file-list-class',
  fileItem: 'file-item-class',
  removeButton: 'remove-button-class',
  modelTypeSelect: 'model-type-select-class',
  submitButton: 'submit-button-class',
}));

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area and file input', () => {
    render(<FileUploader />);
    
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop/)).toBeInTheDocument();
    expect(screen.getByText('UPLOAD FILE(S)')).toBeInTheDocument();
  });

  it('renders file requirements section', () => {
    render(<FileUploader />);
    
    expect(screen.getByText('Before uploading...')).toBeInTheDocument();
    expect(screen.getByText('Check that the model file meets the following requirements.')).toBeInTheDocument();
    expect(screen.getByText('File Size:')).toBeInTheDocument();
    expect(screen.getByText('Data Format:')).toBeInTheDocument();
    expect(screen.getByText('Serializer Type:')).toBeInTheDocument();
  });

  it('renders file input with correct attributes', () => {
    render(<FileUploader />);
    
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.sav,.pkl');
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('id', 'fileInput');
  });

  it('renders selected files section', () => {
    render(<FileUploader />);
    
    expect(screen.getByText('Selected Files:')).toBeInTheDocument();
  });

  it('handles drag and drop events', () => {
    render(<FileUploader />);
    
    const uploadArea = screen.getByText(/Drag & drop/).closest('div');
    const file = new File(['test content'], 'dropped.zip', { type: 'application/zip' });
    
    // Test drag over
    fireEvent.dragOver(uploadArea!);
    
    // Test drop
    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(screen.getByText('dropped.zip')).toBeInTheDocument();
  });

  it('prevents default on drag events', () => {
    render(<FileUploader />);
    
    const uploadArea = screen.getByText(/Drag & drop/).closest('div');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault');
    
    fireEvent(uploadArea!, dragOverEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('shows model type selection for uploaded files', () => {
    render(<FileUploader />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test content'], 'test.zip', { type: 'application/zip' });
    
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // Should show model type dropdown
    expect(screen.getByDisplayValue('Select')).toBeInTheDocument();
  });

  it('handles multiple file uploads', () => {
    render(<FileUploader />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const file1 = new File(['content1'], 'file1.zip', { type: 'application/zip' });
    const file2 = new File(['content2'], 'file2.zip', { type: 'application/zip' });
    
    fireEvent.change(fileInput!, { target: { files: [file1, file2] } });
    
    expect(screen.getByText('file1.zip')).toBeInTheDocument();
    expect(screen.getByText('file2.zip')).toBeInTheDocument();
  });

  it('submits form successfully with valid data', async () => {
    render(<FileUploader />);
    
    // Add a file
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test content'], 'test.zip', { type: 'application/zip' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // Select model type
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FILE(S)');
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

  it('provides mutation callbacks', () => {
    render(<FileUploader />);
    
    // Add a file and select model type
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test content'], 'test.zip', { type: 'application/zip' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    const modelTypeSelect = screen.getByDisplayValue('Select');
    fireEvent.change(modelTypeSelect, { target: { value: 'classification' } });
    
    // Submit form
    const submitButton = screen.getByText('UPLOAD FILE(S)');
    fireEvent.click(submitButton);
    
    // Get the callbacks
    const onSuccessCallback = mockMutate.mock.calls[0][1].onSuccess;
    const onErrorCallback = mockMutate.mock.calls[0][1].onError;
    
    expect(typeof onSuccessCallback).toBe('function');
    expect(typeof onErrorCallback).toBe('function');
  });
}); 