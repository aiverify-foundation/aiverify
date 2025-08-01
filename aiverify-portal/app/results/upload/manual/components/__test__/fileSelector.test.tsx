import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileSelector, FileSelectorHandle } from '../fileSelector';

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, onClick, svgClassName }: any) => (
    <div data-testid="icon" data-name={name} className={svgClassName} onClick={onClick}>
      Icon
    </div>
  ),
  IconName: {
    Close: 'close',
  },
}));

// Mock the FileSelect component
jest.mock('@/lib/components/fileSelect', () => {
  const FileSelectComponent = ({ children, onFilesSelected }: any) => {
    // Create a ref to store the onFilesSelected callback
    const callbackRef = React.useRef(onFilesSelected);
    callbackRef.current = onFilesSelected;

    // Find the Input component and modify it to trigger onFilesSelected
    const modifiedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type && (child.type as any).displayName === 'FileSelectInput') {
        return React.cloneElement(child, {
          onChange: (e: any) => {
            const files = Array.from(e.target.files || []);
            if (callbackRef.current) {
              callbackRef.current(files);
            }
          },
        } as any);
      }
      return child;
    });

    return (
      <div data-testid="file-select">
        {modifiedChildren}
      </div>
    );
  };
  
  const FileSelectInput = ({ accept, multiple }: any) => (
    <input 
      type="file" 
      accept={accept} 
      multiple={multiple}
      data-testid="file-input"
    />
  );
  FileSelectInput.displayName = 'FileSelectInput';
  
  const FileSelectDropZone = ({ children, style }: any) => (
    <div data-testid="drop-zone" style={style}>
      {children}
    </div>
  );
  
  FileSelectComponent.Input = FileSelectInput;
  FileSelectComponent.DropZone = FileSelectDropZone;
  
  return {
    FileSelect: FileSelectComponent,
  };
});

// Mock the cn utility
jest.mock('@/lib/utils/twmerge', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

describe('FileSelector', () => {
  const mockFiles = [
    new File(['test content 1'], 'test1.txt', { type: 'text/plain' }),
    new File(['test content 2'], 'test2.txt', { type: 'text/plain' }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the file selector component', () => {
    render(<FileSelector ref={null} />);
    
    expect(screen.getByTestId('file-select')).toBeInTheDocument();
    expect(screen.getByText('Add test artifacts here')).toBeInTheDocument();
    expect(screen.getByText('(click or drag & drop files)')).toBeInTheDocument();
  });

  it('displays the correct number of test artifacts', () => {
    render(<FileSelector ref={null} />);
    
    expect(screen.getByText('0 Test Artifacts')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<FileSelector ref={null} className="custom-class" />);
    
    const container = screen.getByTestId('file-select').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('provides proper accessibility', () => {
    render(<FileSelector ref={null} />);
    
    expect(screen.getByText('Add test artifacts here')).toBeInTheDocument();
    expect(screen.getByText('(click or drag & drop files)')).toBeInTheDocument();
    
    const fileSelect = screen.getByTestId('file-select');
    expect(fileSelect).toBeInTheDocument();
  });

  it('renders file input with correct attributes', () => {
    render(<FileSelector ref={null} />);
    
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept', '*/*');
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('renders drop zone with correct styling', () => {
    render(<FileSelector ref={null} />);
    
    const dropZone = screen.getByTestId('drop-zone');
    expect(dropZone).toBeInTheDocument();
    expect(dropZone).toHaveStyle({
      backgroundColor: 'var(--color-primary-700)',
      borderColor: 'var(--color-primary-600)',
      borderRadius: '4px',
      padding: '40px',
    });
  });

  it('renders empty file list initially', () => {
    render(<FileSelector ref={null} />);
    
    const fileList = screen.getByRole('list');
    expect(fileList).toBeInTheDocument();
    expect(fileList.children).toHaveLength(0);
  });

  it('handles ref correctly', () => {
    const ref = React.createRef<FileSelectorHandle>();
    render(<FileSelector ref={ref} />);
    
    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.getFiles).toBe('function');
    expect(typeof ref.current?.clearFiles).toBe('function');
  });
}); 