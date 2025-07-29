import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelUploader from '../ModelUploader';

// Mock child components
jest.mock('../FileUploader', () => () => <div data-testid="file-uploader">File Uploader</div>);
jest.mock('../FolderUploader', () => (props: any) => (
  <div data-testid="folder-uploader">
    <button onClick={props.onBack}>Cancel Folder Upload</button>
  </div>
));

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: (props: any) => <div data-testid={`icon-${props.name}`} onClick={props.onClick} />,
  IconName: { ArrowLeft: 'ArrowLeft' }
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
    OUTLINE: 'outline'
  }
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('ModelUploader', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with file tab active by default', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    expect(screen.getByText('Add New AI Model > Upload Model')).toBeInTheDocument();
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    expect(screen.queryByTestId('folder-uploader')).not.toBeInTheDocument();
  });

  it('shows file tab button as active by default', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    const fileButton = screen.getByTestId('button-FILE');
    const folderButton = screen.getByTestId('button-FOLDER');
    
    expect(fileButton).toHaveClass('!rounded-r-none', 'rounded-l-full');
    expect(folderButton).toHaveClass('!rounded-l-none', 'rounded-r-full');
  });

  it('switches to folder tab when folder button is clicked', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    // Click folder button
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    
    expect(screen.getByTestId('folder-uploader')).toBeInTheDocument();
    expect(screen.queryByTestId('file-uploader')).not.toBeInTheDocument();
  });

  it('updates button styles when switching tabs', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    const fileButton = screen.getByTestId('button-FILE');
    const folderButton = screen.getByTestId('button-FOLDER');
    
    // Initially file is active
    expect(fileButton).toHaveClass('!rounded-r-none', 'rounded-l-full');
    expect(folderButton).toHaveClass('!rounded-l-none', 'rounded-r-full');
    
    // Click folder button
    fireEvent.click(folderButton);
    
    // Now folder should be active
    expect(folderButton).toHaveClass('!rounded-l-none', 'rounded-r-full');
    expect(fileButton).toHaveClass('!rounded-r-none', 'rounded-l-full');
  });

  it('switches back to file tab when file button is clicked', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    // First switch to folder
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    expect(screen.getByTestId('folder-uploader')).toBeInTheDocument();
    
    // Then switch back to file
    fireEvent.click(screen.getByTestId('button-FILE'));
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    expect(screen.queryByTestId('folder-uploader')).not.toBeInTheDocument();
  });

  it('calls onBack when back arrow is clicked', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByTestId('icon-ArrowLeft'));
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when folder upload is cancelled', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    // Switch to folder tab
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    
    // Click cancel button in folder uploader
    fireEvent.click(screen.getByText('Cancel Folder Upload'));
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('logs tab changes to console', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    // Switch to folder tab
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    
    expect(console.log).toHaveBeenCalledWith('Upload mode switched to: FOLDER');
    expect(console.log).toHaveBeenCalledWith('User selected FOLDER upload tab');
  });

  it('logs back button clicks to console', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByTestId('icon-ArrowLeft'));
    
    expect(console.log).toHaveBeenCalledWith('User clicked back button');
  });

  it('logs folder upload cancellation to console', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    // Switch to folder tab
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel Folder Upload'));
    
    expect(console.log).toHaveBeenCalledWith('User cancelled folder upload');
  });

  it('renders tab buttons with correct styling classes', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    const fileButton = screen.getByTestId('button-FILE');
    const folderButton = screen.getByTestId('button-FOLDER');
    
    expect(fileButton).toHaveClass('!rounded-r-none', 'rounded-l-full');
    expect(folderButton).toHaveClass('!rounded-l-none', 'rounded-r-full');
  });

  it('maintains tab state when switching between tabs multiple times', () => {
    render(<ModelUploader onBack={mockOnBack} />);
    
    // Switch to folder
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    expect(screen.getByTestId('folder-uploader')).toBeInTheDocument();
    
    // Switch to file
    fireEvent.click(screen.getByTestId('button-FILE'));
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    
    // Switch back to folder
    fireEvent.click(screen.getByTestId('button-FOLDER'));
    expect(screen.getByTestId('folder-uploader')).toBeInTheDocument();
  });
}); 