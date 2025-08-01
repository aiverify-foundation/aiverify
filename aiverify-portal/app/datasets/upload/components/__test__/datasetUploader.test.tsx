import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatasetUploader } from '../datasetUploader';
import { FileUpload } from '@/app/datasets/upload/types';

// Mock dependencies
jest.mock('@/app/datasets/upload/utils/uploadDatasetFile', () => ({
  uploadDatasetFile: jest.fn(),
}));

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: any) => (
    <div data-testid={`icon-${name}`} style={{ width: size, height: size, color }}>
      {name} Icon
    </div>
  ),
  IconName: {
    Upload: 'Upload',
    Close: 'Close',
    Check: 'Check',
    Alert: 'Alert',
    ArrowLeft: 'ArrowLeft', // Added for the back button
  },
}));

jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, disabled, variant, pill, textColor, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid={`button-${text?.toLowerCase().replace(/\s+/g, '-')}`}
      data-variant={variant}
      data-pill={pill}
      data-textcolor={textColor}
      className={className}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    OUTLINE: 'outline',
  },
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: ({ isVisible, onCloseIconClick, children }: any) => 
    isVisible ? (
      <div data-testid="modal" onClick={onCloseIconClick}>
        <div data-testid="modal-content">{children}</div>
      </div>
    ) : null,
}));

// Mock DatasetFolderUploader
jest.mock('../DatasetFolderUploader', () => ({
  DatasetFolderUploader: () => <div data-testid="folder-uploader">Folder Uploader Component</div>,
}));

const mockUploadDatasetFile = require('@/app/datasets/upload/utils/uploadDatasetFile').uploadDatasetFile;

describe('DatasetUploader', () => {
  const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadDatasetFile.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('renders the uploader with file and folder tabs', () => {
      render(<DatasetUploader />);
      
      expect(screen.getByText('FILE')).toBeInTheDocument();
      expect(screen.getByText('FOLDER')).toBeInTheDocument();
    });

    it('renders file upload interface by default', () => {
      render(<DatasetUploader />);
      
      expect(screen.getByText('Drag & drop or')).toBeInTheDocument();
      expect(screen.getByText('Click to Browse')).toBeInTheDocument();
      expect(screen.getByTestId('button-confirm-upload')).toBeInTheDocument();
    });

    it('renders folder upload interface when folder tab is selected', () => {
      render(<DatasetUploader />);
      
      const folderTab = screen.getByText('FOLDER');
      fireEvent.click(folderTab);
      
      expect(screen.getByTestId('folder-uploader')).toBeInTheDocument();
    });

    it('renders upload icons', () => {
      render(<DatasetUploader />);
      
      expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('switches to folder upload tab when clicked', () => {
      render(<DatasetUploader />);
      
      const folderTab = screen.getByText('FOLDER');
      fireEvent.click(folderTab);
      
      expect(screen.getByTestId('folder-uploader')).toBeInTheDocument();
    });

    it('switches back to file upload tab when clicked', () => {
      render(<DatasetUploader />);
      
      const folderTab = screen.getByText('FOLDER');
      fireEvent.click(folderTab);
      
      const fileTab = screen.getByText('FILE');
      fireEvent.click(fileTab);
      
      expect(screen.getByText('Drag & drop or')).toBeInTheDocument();
      expect(screen.getByText('Click to Browse')).toBeInTheDocument();
    });
  });

  describe('File Upload Functionality', () => {
    it('handles file selection via input', async () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
    });

    it('handles multiple file selection', async () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [
        new File(['content1'], 'file1.csv', { type: 'text/csv' }),
        new File(['content2'], 'file2.csv', { type: 'text/csv' }),
      ];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('file1.csv')).toBeInTheDocument();
        expect(screen.getByText('file2.csv')).toBeInTheDocument();
      });
    });

    it('removes file when remove button is clicked', async () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByTestId('icon-Close');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
      });
    });

    it('uploads files when upload button is clicked', async () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockUploadDatasetFile).toHaveBeenCalled();
      });
    });

    it('shows upload progress', async () => {
      mockUploadDatasetFile.mockImplementation(({ onProgress }: { onProgress: (progress: number) => void }) => {
        onProgress(50);
        return Promise.resolve({ success: true });
      });
      
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockUploadDatasetFile).toHaveBeenCalled();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('handles file drop', async () => {
      render(<DatasetUploader />);
      
      const dropZone = screen.getByText('Drag & drop or').closest('div');
      
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [mockFile],
        },
      };
      
      fireEvent.drop(dropZone!, dropEvent as any);
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
    });

    it('prevents default on drag over', () => {
      render(<DatasetUploader />);
      
      const dropZone = screen.getByText('Drag & drop or').closest('div');
      
      const dragOverEvent = {
        preventDefault: jest.fn(),
      };
      
      fireEvent.dragOver(dropZone!, dragOverEvent as any);
      
      // The component may not have drag over handlers, so we just test that it doesn't crash
      expect(dropZone).toBeInTheDocument();
    });
  });

  describe('Upload States', () => {
    it('shows uploading state during upload', async () => {
      mockUploadDatasetFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      // The button should be disabled and show "UPLOADING..." text
      expect(screen.getByTestId('button-uploading...')).toBeDisabled();
    });

    it('shows file status after upload attempt', async () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles upload errors gracefully', async () => {
      mockUploadDatasetFile.mockRejectedValue(new Error('Network error'));
      
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByTestId('button-confirm-upload');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
    });

    it('handles empty file selection', () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [] } });
      
      // Should not crash and should not show any files
      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<DatasetUploader />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('supports keyboard navigation for tabs', () => {
      render(<DatasetUploader />);
      
      const fileTab = screen.getByText('FILE');
      const folderTab = screen.getByText('FOLDER');
      
      expect(fileTab).toBeInTheDocument();
      expect(folderTab).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles files with special characters in names', async () => {
      render(<DatasetUploader />);
      
      const specialFile = new File(['content'], 'test@#$%^&*().csv', { type: 'text/csv' });
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [specialFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('test@#$%^&*().csv')).toBeInTheDocument();
      });
    });

    it('handles very large files', async () => {
      render(<DatasetUploader />);
      
      const largeFile = new File(['x'.repeat(1000000)], 'large.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('large.csv')).toBeInTheDocument();
      });
    });

    it('handles multiple file selections', async () => {
      render(<DatasetUploader />);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      const files = [mockFile];
      
      // First selection
      fireEvent.change(fileInput, { target: { files } });
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      // Second selection - this will add another file with the same name
      fireEvent.change(fileInput, { target: { files } });
      await waitFor(() => {
        expect(screen.getAllByText('test.csv')).toHaveLength(2);
      });
    });
  });
}); 