import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileSelector } from '../fileSelector';

// Mock Icon
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, onClick }: any) => (
    <div data-testid={`icon-${name}`} onClick={onClick}>Icon: {name}</div>
  ),
  IconName: { Close: 'Close' },
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

describe('FileSelector (manual)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createFile(name: string, size = 1234, type = 'application/json') {
    const file = new File(['file content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  }

  it('renders file input and initial state', () => {
    render(<FileSelector ref={null} />);
    expect(screen.getByTestId('file-select')).toBeInTheDocument();
    expect(screen.getByText('0 Test Artifacts')).toBeInTheDocument();
  });

  it('adds files and displays them', () => {
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('artifact.json');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    expect(screen.getByText('1 Test Artifacts')).toBeInTheDocument();
    expect(screen.getByText('artifact.json')).toBeInTheDocument();
  });

  it('removes a file when close icon is clicked', () => {
    render(<FileSelector ref={null} />);
    const fileInput = screen.getByTestId('file-input');
    const file = createFile('artifact.json');
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    fireEvent.click(screen.getByTestId('icon-Close'));
    expect(screen.getByText('0 Test Artifacts')).toBeInTheDocument();
  });

  it('imperative handle: getFiles and clearFiles', () => {
    const ref = createRef<any>();
    render(<FileSelector ref={ref} />);
    const file = createFile('artifact.json');
    act(() => {
      ref.current?.getFiles();
      ref.current?.clearFiles();
    });
    // Should not throw and should clear files
    expect(screen.getByText('0 Test Artifacts')).toBeInTheDocument();
  });
}); 