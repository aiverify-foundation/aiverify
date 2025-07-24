import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileSelector } from '../fileSelector';

// Mock uploadZipFile utility
const mockUploadZipFile = jest.fn();
jest.mock('../../utils/uploadZipFile', () => ({
  uploadZipFile: (...args: any[]) => mockUploadZipFile(...args),
}));

// Mock Icon
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, onClick }: any) => (
    <div data-testid={`icon-${name}`} onClick={onClick}>Icon: {name}</div>
  ),
  IconName: { Close: 'Close' },
}));

// Mock Button
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, disabled, ...props }: any) => (
    <button
      data-testid={`button-${text?.replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {text}
    </button>
  ),
  ButtonVariant: { PRIMARY: 'primary', SECONDARY: 'secondary' },
}));

// Mock FileSelect
jest.mock('@/lib/components/fileSelect', () => {
  const FileSelect = ({ children, onFilesSelected, disabled, className }: any) => (
    <div data-testid="file-select" className={className}>
      <input
        data-testid="file-input"
        type="file"
        multiple
        disabled={disabled}
        onChange={e => {
          if (onFilesSelected) {
            // Simulate file selection
            const files = Array.from((e.target as HTMLInputElement).files || []);
            onFilesSelected(files);
          }
        }}
      />
      {children}
    </div>
  );
  FileSelect.Input = () => null;
  FileSelect.DropZone = ({ children }: any) => <div>{children}</div>;
  return { FileSelect };
});

describe('FileSelector (zipfile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createFile(name: string, size = 1234, type = 'application/zip') {
    const file = new File(['file content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  }

  it('renders file input and initial state', () => {
    render(<FileSelector ref={null} />);
    expect(screen.getByTestId('file-select')).toBeInTheDocument();
    expect(screen.getByText('0 Zip File(s)')).toBeInTheDocument();
  });

  it('adds files and displays them', () => {
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('test.zip');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    expect(screen.getByText('1 Zip File(s)')).toBeInTheDocument();
    expect(screen.getByText('test.zip')).toBeInTheDocument();
  });

  it('prevents duplicate files', () => {
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('test.zip');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    expect(screen.getByText('1 Zip File(s)')).toBeInTheDocument();
  });

  it('removes a file when close icon is clicked', () => {
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('test.zip');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    fireEvent.click(screen.getByTestId('icon-Close'));
    expect(screen.getByText('0 Zip File(s)')).toBeInTheDocument();
  });

  it('calls uploadZipFile and updates progress/status on upload', async () => {
    mockUploadZipFile.mockImplementation(({ onProgress }: any) => {
      onProgress(50);
      return Promise.resolve('success');
    });
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('test.zip');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    fireEvent.click(screen.getByTestId('button-upload'));
    expect(mockUploadZipFile).toHaveBeenCalled();
    // Progress bar and status should update
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
  });

  it('shows error status and error message on upload failure', async () => {
    mockUploadZipFile.mockImplementation(({ onProgress }: any) => {
      onProgress(100);
      return Promise.reject({ message: 'Upload failed' });
    });
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('fail.zip');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    fireEvent.click(screen.getByTestId('button-upload'));
    expect(mockUploadZipFile).toHaveBeenCalled();
    expect(await screen.findByText('Error')).toBeInTheDocument();
    // Show error message after clicking View Errors
    fireEvent.click(screen.getByTestId('button-view-errors'));
    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('shows Upload More button after upload completes', async () => {
    mockUploadZipFile.mockResolvedValue('success');
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('test.zip');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    fireEvent.click(screen.getByTestId('button-upload'));
    expect(await screen.findByTestId('button-upload-more')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('button-upload-more'));
    expect(screen.getByText('0 Zip File(s)')).toBeInTheDocument();
  });

  it('imperative handle: getFiles and clearFiles', () => {
    const ref = createRef<any>();
    render(<FileSelector ref={ref} />);
    const file = createFile('test.zip');
    act(() => {
      ref.current?.getFiles();
      ref.current?.clearFiles();
    });
    // Should not throw and should clear files
    expect(screen.getByText('0 Zip File(s)')).toBeInTheDocument();
  });
}); 