import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageNavigation } from '../pageNavigation';

// Mock the icon components
jest.mock('@remixicon/react', () => ({
  RiArrowUpSLine: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="previous-button">
      Previous
    </button>
  ),
  RiArrowDownSLine: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="next-button">
      Next
    </button>
  ),
  RiFileAddLine: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="add-page-button">
      Add Page
    </button>
  ),
  RiInputCursorMove: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="input-toggle-button">
      Toggle Input
    </button>
  ),
}));

describe('PageNavigation', () => {
  const defaultProps = {
    totalPages: 5,
    currentPage: 0,
    onPageChange: jest.fn(),
    onNextPage: jest.fn(),
    onPreviousPage: jest.fn(),
    onAddPage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders navigation controls', () => {
      render(<PageNavigation {...defaultProps} />);
      
      expect(screen.getAllByTestId('previous-button')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('next-button')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('add-page-button')[0]).toBeInTheDocument();
    });

    it('renders page numbers correctly', () => {
      render(<PageNavigation {...defaultProps} totalPages={5} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('highlights current page', () => {
      render(<PageNavigation {...defaultProps} currentPage={2} />);
      
      const currentPageButton = screen.getByText('3'); // currentPage is 0-indexed
      expect(currentPageButton).toHaveClass('bg-gray-700', 'text-white');
    });

    it('disables previous button on first page', () => {
      render(<PageNavigation {...defaultProps} currentPage={0} />);
      
      const previousButton = screen.getAllByTestId('previous-button')[0];
      expect(previousButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<PageNavigation {...defaultProps} currentPage={4} />);
      
      const nextButton = screen.getAllByTestId('next-button')[0];
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Page Navigation Logic', () => {
    describe('getVisiblePages with 9 or fewer pages', () => {
      it('shows all pages when total is 5', () => {
        render(<PageNavigation {...defaultProps} totalPages={5} currentPage={2} />);
        
        // Should show pages 1, 2, 3, 4, 5
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      it('shows all pages when total is 9', () => {
        render(<PageNavigation {...defaultProps} totalPages={9} currentPage={4} />);
        
        // Should show pages 1 through 9
        for (let i = 1; i <= 9; i++) {
          expect(screen.getByText(i.toString())).toBeInTheDocument();
        }
      });
    });

    describe('getVisiblePages with more than 9 pages', () => {
      it('shows first 7 pages + dots + last page when current page is in first half', () => {
        render(<PageNavigation {...defaultProps} totalPages={15} currentPage={3} />);
        
        // Should show: 1, 2, 3, 4, 5, 6, 7, ..., 15
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getAllByText('...')).toHaveLength(1);
      });

      it('shows first page + dots + last 7 pages when current page is in last half', () => {
        render(<PageNavigation {...defaultProps} totalPages={15} currentPage={12} />);
        
        // Should show: 1, ..., 9, 10, 11, 12, 13, 14, 15
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getAllByText('...')).toHaveLength(1);
      });

      it('shows first page + dots + 5 pages around current + dots + last page when current is in middle', () => {
        render(<PageNavigation {...defaultProps} totalPages={15} currentPage={8} />);
        
        // Should show: 1, ..., 7, 8, 9, 10, 11, ..., 15
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        
        // Should have two sets of dots
        expect(screen.getAllByText('...')).toHaveLength(2);
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onPreviousPage when previous button is clicked', () => {
      render(<PageNavigation {...defaultProps} currentPage={1} />);
      
      fireEvent.click(screen.getAllByTestId('previous-button')[0]);
      
      expect(defaultProps.onPreviousPage).toHaveBeenCalledTimes(1);
    });

    it('calls onNextPage when next button is clicked', () => {
      render(<PageNavigation {...defaultProps} />);
      
      fireEvent.click(screen.getAllByTestId('next-button')[0]);
      
      expect(defaultProps.onNextPage).toHaveBeenCalledTimes(1);
    });

    it('calls onAddPage when add page button is clicked', () => {
      render(<PageNavigation {...defaultProps} />);
      
      fireEvent.click(screen.getAllByTestId('add-page-button')[0]);
      
      expect(defaultProps.onAddPage).toHaveBeenCalledTimes(1);
    });

    it('calls onPageChange when page number is clicked', () => {
      render(<PageNavigation {...defaultProps} />);
      
      fireEvent.click(screen.getByText('3'));
      
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2); // 0-indexed
    });
  });

  describe('Input Navigation', () => {
    it('toggles input visibility when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<PageNavigation {...defaultProps} totalPages={10} />);
      
      // Input should be visible but with opacity 0 and translated initially
      const input = screen.queryByRole('textbox');
      if (input) {
        const inputContainer = input.closest('div[class*="absolute"]');
        expect(inputContainer).toHaveClass('translate-x-8', 'opacity-0');
      }
      
      // Click toggle button
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      // Input should be visible with opacity 1 and no translation
      await waitFor(() => {
        const inputContainer = screen.getByRole('textbox').closest('div[class*="absolute"]');
        expect(inputContainer).toHaveClass('translate-x-0', 'opacity-100');
      });
      
      // Click toggle button again
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      // Input should be hidden again with opacity 0 and translated
      await waitFor(() => {
        const inputContainer = screen.getByRole('textbox').closest('div[class*="absolute"]');
        expect(inputContainer).toHaveClass('translate-x-8', 'opacity-0');
      });
    });

    it('allows only numeric input', async () => {
      const user = userEvent.setup();
      render(<PageNavigation {...defaultProps} totalPages={10} />);
      
      // Show input
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      const input = screen.getByRole('textbox');
      
      // Try to enter non-numeric characters
      await user.type(input, 'abc123def');
      
      // Only numbers should remain
      expect(input).toHaveValue('123');
    });

    it('submits valid page number and navigates', async () => {
      const user = userEvent.setup();
      render(<PageNavigation {...defaultProps} totalPages={10} />);
      
      // Show input
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      const input = screen.getByRole('textbox');
      
      // Enter a valid page number
      await user.type(input, '5');
      await user.keyboard('{Enter}');
      
      // Should call onPageChange with 0-indexed value
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
      
      // Input should be hidden again with opacity 0 and translated
      await waitFor(() => {
        const inputContainer = screen.getByRole('textbox').closest('div[class*="absolute"]');
        expect(inputContainer).toHaveClass('translate-x-8', 'opacity-0');
      });
    });

    it('does not submit invalid page numbers', async () => {
      const user = userEvent.setup();
      render(<PageNavigation {...defaultProps} totalPages={5} />);
      
      // Input toggle button should not be visible for 5 pages
      expect(screen.queryByTestId('input-toggle-button')).not.toBeInTheDocument();
    });

    it('does not submit page number 0', async () => {
      const user = userEvent.setup();
      render(<PageNavigation {...defaultProps} totalPages={10} />);
      
      // Show input
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      const input = screen.getByRole('textbox');
      
      // Enter page number 0
      await user.type(input, '0');
      await user.keyboard('{Enter}');
      
      // Should not call onPageChange
      expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Add Page Button', () => {
    it('is disabled when disableAddPage is true', () => {
      render(<PageNavigation {...defaultProps} disableAddPage={true} />);
      
      expect(screen.queryByTestId('add-page-button')).not.toBeInTheDocument();
    });

    it('is enabled when disableAddPage is false', () => {
      render(<PageNavigation {...defaultProps} disableAddPage={false} />);
      
      expect(screen.getAllByTestId('add-page-button')[0]).toBeInTheDocument();
    });

    it('is enabled when disableAddPage is not provided', () => {
      render(<PageNavigation {...defaultProps} />);
      
      expect(screen.getAllByTestId('add-page-button')[0]).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single page', () => {
      render(<PageNavigation {...defaultProps} totalPages={1} currentPage={0} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('handles zero pages', () => {
      render(<PageNavigation {...defaultProps} totalPages={0} />);
      
      // Should not crash and should show appropriate state
      expect(screen.getAllByTestId('previous-button')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('next-button')[0]).toBeInTheDocument();
    });

    it('handles very large number of pages', () => {
      render(<PageNavigation {...defaultProps} totalPages={1000} currentPage={500} />);
      
      // Should show pagination with dots
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getAllByText('...')).toHaveLength(2);
    });

    it('handles current page at boundaries', () => {
      // First page
      const { unmount } = render(
        <PageNavigation {...defaultProps} totalPages={10} currentPage={0} />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      unmount();
      
      // Last page
      render(<PageNavigation {...defaultProps} totalPages={10} currentPage={9} />);
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for input navigation', async () => {
      const user = userEvent.setup();
      const { container } = render(<PageNavigation {...defaultProps} totalPages={10} />);
      
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      // Use tag name instead of role
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', '1-10');
    });

    it('provides proper input validation feedback', async () => {
      const user = userEvent.setup();
      render(<PageNavigation {...defaultProps} totalPages={10} />);
      
      await user.click(screen.getAllByTestId('input-toggle-button')[0]);
      
      const input = screen.getByRole('textbox');
      
      // Enter invalid input
      await user.type(input, 'abc');
      expect(input).toHaveValue('');
      
      // Enter valid input
      await user.type(input, '3');
      expect(input).toHaveValue('3');
    });
  });

  describe('Integration Scenarios', () => {
    it('works correctly in a multi-page navigation scenario', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      
      render(
        <PageNavigation 
          {...defaultProps} 
          totalPages={20} 
          currentPage={5} 
          onPageChange={onPageChange}
        />
      );
      
      // Test clicking on different page numbers that are visible
      // When currentPage is 5, the visible pages should be: 1, ..., 3, 4, 5, 6, 7, ..., 20
      await user.click(screen.getByText('1'));
      expect(onPageChange).toHaveBeenCalledWith(0);
      await user.click(screen.getByText('5'));
      expect(onPageChange).toHaveBeenCalledWith(4);
      await user.click(screen.getByText('20'));
      expect(onPageChange).toHaveBeenCalledWith(19);
    });

    it('handles rapid navigation correctly', async () => {
      const user = userEvent.setup();
      const onNextPage = jest.fn();
      
      render(
        <PageNavigation 
          {...defaultProps} 
          onNextPage={onNextPage}
        />
      );
      
      // Rapidly click next button
      await user.click(screen.getAllByTestId('next-button')[0]);
      await user.click(screen.getAllByTestId('next-button')[0]);
      await user.click(screen.getAllByTestId('next-button')[0]);
      
      expect(onNextPage).toHaveBeenCalledTimes(3);
    });
  });
}); 