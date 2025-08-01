import React from 'react';
import { render, screen } from '@testing-library/react';
import UploadResultsPage from '../page';

// Mock the DatasetUploader component
jest.mock('../components/datasetUploader', () => ({
  DatasetUploader: () => <div data-testid="dataset-uploader">Dataset Uploader Component</div>,
}));

describe('UploadResultsPage', () => {
  describe('Rendering', () => {
    it('renders the upload page with correct structure', () => {
      render(<UploadResultsPage />);
      
      expect(screen.getByTestId('dataset-uploader')).toBeInTheDocument();
    });

    it('renders with correct container styling', () => {
      const { container } = render(<UploadResultsPage />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('mt-6');
    });

    it('renders the DatasetUploader component', () => {
      render(<UploadResultsPage />);
      
      expect(screen.getByText('Dataset Uploader Component')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct root element', () => {
      const { container } = render(<UploadResultsPage />);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.tagName).toBe('DIV');
    });

    it('has correct container styling', () => {
      const { container } = render(<UploadResultsPage />);
      
      const containerDiv = container.firstChild as HTMLElement;
      expect(containerDiv).toHaveClass('mt-6');
    });
  });

  describe('Integration', () => {
    it('integrates with DatasetUploader component', () => {
      render(<UploadResultsPage />);
      
      // Verify the component is rendered
      expect(screen.getByTestId('dataset-uploader')).toBeInTheDocument();
    });
  });
}); 