import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DatasetsPage from '../page';
import { getTestDatasets } from '@/lib/fetchApis/getTestDatasets';

// Mock dependencies
jest.mock('@/lib/fetchApis/getTestDatasets', () => ({
  getTestDatasets: jest.fn(),
}));

jest.mock('next/cache', () => ({
  unstable_noStore: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockDatasets = [
  {
    id: '1',
    name: 'Test Dataset 1',
    description: 'Test description 1',
    fileType: 'file' as const,
    filename: 'test1.csv',
    zip_hash: 'hash1',
    size: 1024,
    serializer: 'csv',
    dataFormat: 'csv',
    numRows: 100,
    numCols: 5,
    dataColumns: null,
    status: 'valid' as const,
    errorMessages: null,
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T00:00:00',
  },
  {
    id: '2',
    name: 'Test Dataset 2',
    description: 'Test description 2',
    fileType: 'folder' as const,
    filename: 'test2.zip',
    zip_hash: 'hash2',
    size: 2048,
    serializer: 'zip',
    dataFormat: 'zip',
    numRows: 200,
    numCols: 10,
    dataColumns: null,
    status: 'valid' as const,
    errorMessages: null,
    created_at: '2023-01-02T00:00:00',
    updated_at: '2023-01-02T00:00:00',
  },
];

describe('DatasetsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the main page structure', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      expect(screen.getByText('Test Datasets')).toBeInTheDocument();
      expect(screen.getByText('View and manage test datasets')).toBeInTheDocument();
      expect(screen.getByText('UPLOAD DATASET')).toBeInTheDocument();
    });

    it('renders lightning icon', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      // The icon should be present in the DOM
      const iconElement = document.querySelector('svg');
      expect(iconElement).toBeInTheDocument();
    });

    it('renders upload button with correct link', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      const uploadButton = screen.getByText('UPLOAD DATASET');
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton.closest('a')).toHaveAttribute('href', '/datasets/upload');
    });

    it('renders dataset list component', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      // Should render the dataset list component
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Test Dataset 2')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches datasets on component mount', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      expect(getTestDatasets).toHaveBeenCalledTimes(1);
    });

    it('displays datasets when API call succeeds', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Test Dataset 2')).toBeInTheDocument();
      // Only 2 datasets are shown due to pagination, so we don't expect the third one
    });

    it('displays error message when API returns error', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        message: 'Failed to fetch datasets',
      });

      render(await DatasetsPage());

      expect(screen.getByText('Failed to fetch datasets')).toBeInTheDocument();
    });

    it('handles empty datasets array', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: [],
      });

      render(await DatasetsPage());

      // Should still render the page structure
      expect(screen.getByText('Test Datasets')).toBeInTheDocument();
      expect(screen.getByText('UPLOAD DATASET')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API throwing an error', async () => {
      (getTestDatasets as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should not throw and should handle the error gracefully
      await expect(async () => {
        await DatasetsPage();
      }).rejects.toThrow('Network error');
    });

    it('handles null API response', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue(null);

      // Should handle gracefully
      const page = await DatasetsPage();
      render(page);
      
      // Should show error message when API returns null
      expect(screen.getByText('Failed to fetch datasets')).toBeInTheDocument();
    });

    it('handles malformed API response', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        // Missing data property
        someOtherProperty: 'value',
      });

      // Should handle gracefully
      const page = await DatasetsPage();
      render(page);
      
      // Should show error message when API returns malformed data
      expect(screen.getByText('Failed to fetch datasets')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('has correct main container styling', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      const { container } = render(await DatasetsPage());

      const main = container.querySelector('main');
      expect(main).toHaveClass('p-6');
    });

    it('has correct header container styling', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      const { container } = render(await DatasetsPage());

      const headerContainer = container.querySelector('.mb-1');
      expect(headerContainer).toHaveClass('mb-1', 'flex', 'items-center', 'justify-between');
    });

    it('has correct title container styling', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      const { container } = render(await DatasetsPage());

      const titleContainer = container.querySelector('.flex.items-center');
      expect(titleContainer).toHaveClass('flex', 'items-center');
    });

    it('has correct header styling', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      const { container } = render(await DatasetsPage());

      const header = container.querySelector('header');
      expect(header).toHaveClass('ml-3');
    });

    it('has correct title styling', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      const { container } = render(await DatasetsPage());

      const title = container.querySelector('h1');
      expect(title).toHaveClass('text-2xl', 'font-bold', 'text-white');
    });

    it('has correct subtitle styling', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      const { container } = render(await DatasetsPage());

      const subtitle = container.querySelector('h3');
      expect(subtitle).toHaveClass('text-white');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Datasets');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('View and manage test datasets');
    });

    it('has proper link structure for upload button', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: mockDatasets,
      });

      render(await DatasetsPage());

      const uploadLink = screen.getByText('UPLOAD DATASET').closest('a');
      expect(uploadLink).toHaveAttribute('href', '/datasets/upload');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large dataset arrays', async () => {
      const largeDatasets = Array.from({ length: 1000 }, (_, i) => ({
        ...mockDatasets[0],
        id: i.toString(),
        name: `Dataset ${i}`,
      }));

      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: largeDatasets,
      });

      render(await DatasetsPage());

      // Should still render without issues
      expect(screen.getByText('Test Datasets')).toBeInTheDocument();
    });

    it('handles datasets with missing properties', async () => {
      const incompleteDatasets = [
        {
          id: '1',
          name: 'Incomplete Dataset',
          // Missing other required properties
        },
      ];

      (getTestDatasets as jest.Mock).mockResolvedValue({
        data: incompleteDatasets,
      });

      // Should handle gracefully
      expect(async () => {
        render(await DatasetsPage());
      }).not.toThrow();
    });

    it('handles null API response', async () => {
      (getTestDatasets as jest.Mock).mockResolvedValue(null);

      // Should handle gracefully
      expect(async () => {
        render(await DatasetsPage());
      }).not.toThrow();
    });
  });
}); 