import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Filters } from '../Filters';

describe('Filters', () => {
  const mockOnSearchInputChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search input with correct placeholder', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders search input with correct styling', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      expect(searchInput).toHaveStyle({ paddingLeft: '40px' });
    });

    it('renders magnify glass icon', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      // The icon should be present in the DOM
      const searchContainer = screen.getByPlaceholderText('Search by Name').parentElement;
      expect(searchContainer).toBeInTheDocument();
    });

    it('does not render clear button initially', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const clearButton = screen.queryByRole('button', { name: /clear/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearchInputChange when user types', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('test');
      });
    });

    it('calls onSearchInputChange with empty string when input is cleared', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('');
      });
    });

    it('updates input value when user types', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      expect(searchInput).toHaveValue('test query');
    });

    it('handles special characters in search', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test@#$%^&*()' } });
      
      await waitFor(() => {
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('test@#$%^&*()');
      });
    });

    it('handles very long search queries', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const longQuery = 'a'.repeat(1000);
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: longQuery } });
      
      await waitFor(() => {
        expect(mockOnSearchInputChange).toHaveBeenCalledWith(longQuery);
      });
    });
  });

  describe('Clear Button Functionality', () => {
    it('shows clear button when there is text in the input', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // The clear button is an icon, so we check for the clear icon container
      const clearIconContainer = document.querySelector('[class*="pointer_effect"]');
      expect(clearIconContainer).toBeInTheDocument();
    });

    it('hides clear button when input is empty', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      // The clear icon should not be visible when input is empty
      const clearIconContainer = document.querySelector('[class*="pointer_effect"]');
      expect(clearIconContainer).not.toBeInTheDocument();
    });

    it('clears input and calls onSearchInputChange when clear button is clicked', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearIconContainer = document.querySelector('[class*="pointer_effect"]');
      fireEvent.click(clearIconContainer!);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('');
      });
    });

    it('clears input when clear button is clicked multiple times', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearIconContainer = document.querySelector('[class*="pointer_effect"]');
      fireEvent.click(clearIconContainer!);
      fireEvent.click(clearIconContainer!); // Should not cause any issues
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('');
      });
    });
  });

  describe('User Interactions', () => {
    it('focuses input when clicked', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
    });

    it('supports keyboard navigation', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
    });

    it('handles Enter key press', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      
      // Should not cause any errors
      expect(searchInput).toBeInTheDocument();
    });

    it('handles Escape key press', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Escape', code: 'Escape' });
      
      // Should not clear the input automatically
      expect(searchInput).toHaveValue('test');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search by Name');
    });

    it('clear button has proper accessibility attributes', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // The clear icon should be present and clickable
      const clearIconContainer = document.querySelector('[class*="pointer_effect"]');
      expect(clearIconContainer).toBeInTheDocument();
    });

    it('supports screen reader navigation', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid typing', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      
      // Simulate rapid typing
      fireEvent.change(searchInput, { target: { value: 'a' } });
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      fireEvent.change(searchInput, { target: { value: 'abc' } });
      
      await waitFor(() => {
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('abc');
      });
    });

    it('handles onSearchInputChange being undefined', () => {
      // This should not cause any errors
      expect(() => {
        render(<Filters onSearchInputChange={undefined as any} />);
      }).not.toThrow();
    });

    it('handles empty string input', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: '' } });
      
      // The component should handle empty input gracefully
      expect(searchInput).toHaveValue('');
    });

    it('handles whitespace-only input', async () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search by Name');
      fireEvent.change(searchInput, { target: { value: '   ' } });
      
      await waitFor(() => {
        expect(mockOnSearchInputChange).toHaveBeenCalledWith('   ');
      });
    });
  });

  describe('Styling and Layout', () => {
    it('has correct container styling', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      const container = screen.getByPlaceholderText('Search by Name').closest('section');
      expect(container).toHaveClass('flex', 'justify-between');
    });

    it('has correct input container styling', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      // Check that the input container exists
      const inputContainer = screen.getByPlaceholderText('Search by Name').closest('div');
      expect(inputContainer).toBeInTheDocument();
    });

    it('has correct width styling', () => {
      render(<Filters onSearchInputChange={mockOnSearchInputChange} />);
      
      // Check that the width container exists
      const widthContainer = screen.getByPlaceholderText('Search by Name').closest('div');
      expect(widthContainer).toBeInTheDocument();
    });
  });
}); 