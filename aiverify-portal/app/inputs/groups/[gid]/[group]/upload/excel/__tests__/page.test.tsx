import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import UploadPage from '../page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the LayoutHeader component
jest.mock('../../../components/LayoutHeader', () => {
  return function MockLayoutHeader({ projectId, onBack }: { projectId?: string | null; onBack?: () => void }) {
    return (
      <div data-testid="layout-header">
        <span data-testid="project-id">{projectId || 'no-project-id'}</span>
        {onBack && <button data-testid="back-button" onClick={onBack}>Back</button>}
      </div>
    );
  };
});

// Mock the ExcelUploader component
jest.mock('../components/ExcelUploader', () => {
  return function MockExcelUploader() {
    return <div data-testid="excel-uploader">Excel Uploader Component</div>;
  };
});

const mockRouter = {
  push: jest.fn(),
};

describe('UploadPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('when both flow and projectId are present', () => {
    beforeEach(() => {
      const mockSearchParams = new Map([
        ['projectId', 'test-project-123'],
        ['flow', 'test-flow'],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should render the page with project ID and flow', () => {
      render(<UploadPage />);
      
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-id')).toHaveTextContent('test-project-123');
      expect(screen.getByTestId('excel-uploader')).toBeInTheDocument();
    });

    it('should navigate to project select data page when back button is clicked', () => {
      render(<UploadPage />);
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/project/select_data?flow=test-flow&projectId=test-project-123');
    });

    it('should have correct CSS classes for layout', () => {
      render(<UploadPage />);
      
      // The content area should have flex-1 class
      const contentArea = screen.getByTestId('excel-uploader').parentElement;
      expect(contentArea).toHaveClass('flex-1');
      
      // Check that the main container has the expected structure
      const layoutHeader = screen.getByTestId('layout-header');
      const excelUploader = screen.getByTestId('excel-uploader');
      
      // Both components should be rendered
      expect(layoutHeader).toBeInTheDocument();
      expect(excelUploader).toBeInTheDocument();
    });
  });

  describe('when projectId is present but flow is missing', () => {
    beforeEach(() => {
      const mockSearchParams = new Map([
        ['projectId', 'test-project-123'],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should render the page with project ID but no navigation on back', () => {
      render(<UploadPage />);
      
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-id')).toHaveTextContent('test-project-123');
      expect(screen.getByTestId('excel-uploader')).toBeInTheDocument();
    });

    it('should not navigate when back button is clicked (flow is missing)', () => {
      render(<UploadPage />);
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('when flow is present but projectId is missing', () => {
    beforeEach(() => {
      const mockSearchParams = new Map([
        ['flow', 'test-flow'],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should render the page without project ID and no navigation on back', () => {
      render(<UploadPage />);
      
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-id')).toHaveTextContent('no-project-id');
      expect(screen.getByTestId('excel-uploader')).toBeInTheDocument();
    });

    it('should not navigate when back button is clicked (projectId is missing)', () => {
      render(<UploadPage />);
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('when both flow and projectId are missing', () => {
    beforeEach(() => {
      const mockSearchParams = new Map();
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should render the page without project ID and no navigation on back', () => {
      render(<UploadPage />);
      
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-id')).toHaveTextContent('no-project-id');
      expect(screen.getByTestId('excel-uploader')).toBeInTheDocument();
    });

    it('should not navigate when back button is clicked (both params missing)', () => {
      render(<UploadPage />);
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('when search params return null values', () => {
    beforeEach(() => {
      const mockSearchParams = new Map([
        ['projectId', null],
        ['flow', null],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should render the page without project ID and no navigation on back', () => {
      render(<UploadPage />);
      
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-id')).toHaveTextContent('no-project-id');
      expect(screen.getByTestId('excel-uploader')).toBeInTheDocument();
    });

    it('should not navigate when back button is clicked (null values)', () => {
      render(<UploadPage />);
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('component structure and accessibility', () => {
    beforeEach(() => {
      const mockSearchParams = new Map([
        ['projectId', 'test-project-123'],
        ['flow', 'test-flow'],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should render with proper semantic structure', () => {
      render(<UploadPage />);
      
      // Check that the main container is a div
      const container = screen.getByTestId('layout-header').parentElement?.parentElement;
      expect(container?.tagName).toBe('DIV');
      
      // Check that ExcelUploader is rendered
      expect(screen.getByTestId('excel-uploader')).toBeInTheDocument();
    });

    it('should pass correct props to LayoutHeader', () => {
      render(<UploadPage />);
      
      const layoutHeader = screen.getByTestId('layout-header');
      expect(layoutHeader).toBeInTheDocument();
      
      // Verify projectId is passed correctly
      expect(screen.getByTestId('project-id')).toHaveTextContent('test-project-123');
      
      // Verify onBack function is passed and works
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values for search params', () => {
      const mockSearchParams = new Map([
        ['projectId', ''],
        ['flow', ''],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      render(<UploadPage />);
      
      expect(screen.getByTestId('project-id')).toHaveTextContent('no-project-id');
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      // Should not navigate because empty strings are falsy
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle undefined values for search params', () => {
      const mockSearchParams = new Map([
        ['projectId', undefined],
        ['flow', undefined],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      render(<UploadPage />);
      
      expect(screen.getByTestId('project-id')).toHaveTextContent('no-project-id');
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      // Should not navigate because undefined values are falsy
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
}); 