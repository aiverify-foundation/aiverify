import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageNumber } from '../pageNumber';

// Mock the icon component
jest.mock('@remixicon/react', () => ({
  RiDeleteBinLine: ({ onClick, className, children }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="delete-button"
    >
      {children}
    </button>
  ),
}));

// Mock the Tooltip component
jest.mock('@/lib/components/tooltip', () => ({
  Tooltip: ({ children, content, side, sideOffset }: any) => (
    <div data-testid="tooltip" data-content={content} data-side={side} data-side-offset={sideOffset}>
      {children}
    </div>
  ),
}));

describe('PageNumber', () => {
  const defaultProps = {
    pageNumber: 1,
    zoomLevel: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders page number correctly', () => {
      render(<PageNumber {...defaultProps} />);
      
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <PageNumber {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has correct default styling classes', () => {
      const { container } = render(<PageNumber {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass(
        'absolute',
        'top-0',
        'm-2',
        'flex',
        'origin-top-right',
        'select-none',
        'flex-col',
        'text-xs',
        'text-gray-500'
      );
    });

    it('applies correct transform scale based on zoom level', () => {
      const { container } = render(<PageNumber {...defaultProps} zoomLevel={2} />);
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ transform: 'scale(0.5)' });
    });

    it('applies correct right positioning for normal pages', () => {
      const { container } = render(<PageNumber {...defaultProps} zoomLevel={1} />);
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ right: '-10%' });
    });

    it('applies correct right positioning for overflow pages', () => {
      const { container } = render(
        <PageNumber {...defaultProps} zoomLevel={1} isOverflowPage={true} />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ right: '-15%' });
    });

    it('adjusts positioning based on zoom level', () => {
      const { container } = render(
        <PageNumber {...defaultProps} zoomLevel={0.5} isOverflowPage={true} />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ right: '-30%' });
    });
  });

  describe('Delete Button', () => {
    it('renders delete button when onDeleteClick is provided', () => {
      const onDeleteClick = jest.fn();
      render(<PageNumber {...defaultProps} onDeleteClick={onDeleteClick} />);
      
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    it('does not render delete button when onDeleteClick is not provided', () => {
      render(<PageNumber {...defaultProps} />);
      
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('calls onDeleteClick when delete button is clicked', () => {
      const onDeleteClick = jest.fn();
      render(<PageNumber {...defaultProps} onDeleteClick={onDeleteClick} />);
      
      fireEvent.click(screen.getByTestId('delete-button'));
      
      expect(onDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('does not render delete button when disableDelete is true', () => {
      const onDeleteClick = jest.fn();
      render(
        <PageNumber {...defaultProps} onDeleteClick={onDeleteClick} disableDelete={true} />
      );
      
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('renders delete button when disableDelete is false', () => {
      const onDeleteClick = jest.fn();
      render(
        <PageNumber {...defaultProps} onDeleteClick={onDeleteClick} disableDelete={false} />
      );
      
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    it('renders delete button when disableDelete is not provided', () => {
      const onDeleteClick = jest.fn();
      render(<PageNumber {...defaultProps} onDeleteClick={onDeleteClick} />);
      
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });
  });

  describe('Overflow Page Indicator', () => {
    it('renders overflow indicator when isOverflowPage is true', () => {
      render(<PageNumber {...defaultProps} isOverflowPage={true} />);
      
      expect(screen.getByText('(Overflow)')).toBeInTheDocument();
    });

    it('does not render overflow indicator when isOverflowPage is false', () => {
      render(<PageNumber {...defaultProps} isOverflowPage={false} />);
      
      expect(screen.queryByText('(Overflow)')).not.toBeInTheDocument();
    });

    it('does not render overflow indicator when isOverflowPage is not provided', () => {
      render(<PageNumber {...defaultProps} />);
      
      expect(screen.queryByText('(Overflow)')).not.toBeInTheDocument();
    });

    it('renders both delete button and overflow indicator when both conditions are met', () => {
      const onDeleteClick = jest.fn();
      render(
        <PageNumber 
          {...defaultProps} 
          onDeleteClick={onDeleteClick} 
          isOverflowPage={true} 
        />
      );
      
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
      expect(screen.getByText('(Overflow)')).toBeInTheDocument();
    });
  });

  describe('Tooltip Integration', () => {
    it('renders tooltip with correct props when delete button is present', () => {
      const onDeleteClick = jest.fn();
      render(<PageNumber {...defaultProps} onDeleteClick={onDeleteClick} />);
      
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute('data-content', 'Delete Page');
      expect(tooltip).toHaveAttribute('data-side', 'right');
      expect(tooltip).toHaveAttribute('data-side-offset', '-10');
    });

    it('does not render tooltip when delete button is not present', () => {
      render(<PageNumber {...defaultProps} />);
      
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles page number 0', () => {
      render(<PageNumber {...defaultProps} pageNumber={0} />);
      
      expect(screen.getByText('Page 0')).toBeInTheDocument();
    });

    it('handles large page numbers', () => {
      render(<PageNumber {...defaultProps} pageNumber={999} />);
      
      expect(screen.getByText('Page 999')).toBeInTheDocument();
    });

    it('handles negative page numbers', () => {
      render(<PageNumber {...defaultProps} pageNumber={-1} />);
      
      expect(screen.getByText('Page -1')).toBeInTheDocument();
    });

    it('handles zoom level of 0', () => {
      const { container } = render(<PageNumber {...defaultProps} zoomLevel={0} />);
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ transform: 'scale(Infinity)' });
    });

    it('handles very small zoom levels', () => {
      const { container } = render(<PageNumber {...defaultProps} zoomLevel={0.1} />);
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ transform: 'scale(10)' });
    });

    it('handles very large zoom levels', () => {
      const { container } = render(<PageNumber {...defaultProps} zoomLevel={10} />);
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyle({ transform: 'scale(0.1)' });
    });
  });

  describe('Accessibility', () => {
    it('has proper styling for delete button', () => {
      const onDeleteClick = jest.fn();
      render(<PageNumber {...defaultProps} onDeleteClick={onDeleteClick} />);
      
      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton).toHaveClass(
        'mt-2',
        'cursor-pointer',
        'rounded',
        'bg-gray-300',
        'p-1',
        'text-gray-500',
        'shadow-sm',
        'hover:text-red-500'
      );
    });

    it('has proper styling for overflow indicator', () => {
      render(<PageNumber {...defaultProps} isOverflowPage={true} />);
      
      const overflowText = screen.getByText('(Overflow)');
      expect(overflowText).toHaveClass('mt-2', 'text-xs', 'text-gray-400');
    });
  });

  describe('Integration Scenarios', () => {
    it('works correctly in a multi-page scenario', () => {
      const onDeleteClick = jest.fn();
      const pages = [1, 2, 3, 4, 5];
      
      pages.forEach((pageNumber, index) => {
        const { unmount } = render(
          <PageNumber 
            {...defaultProps} 
            pageNumber={pageNumber}
            onDeleteClick={index === 2 ? onDeleteClick : undefined}
            isOverflowPage={index === 4}
          />
        );
        
        expect(screen.getByText(`Page ${pageNumber}`)).toBeInTheDocument();
        
        if (index === 2) {
          expect(screen.getByTestId('delete-button')).toBeInTheDocument();
        }
        
        if (index === 4) {
          expect(screen.getByText('(Overflow)')).toBeInTheDocument();
        }
        
        unmount();
      });
    });

    it('handles zoom level changes correctly', () => {
      const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      
      zoomLevels.forEach(zoomLevel => {
        const { container, unmount } = render(
          <PageNumber {...defaultProps} zoomLevel={zoomLevel} />
        );
        
        const element = container.firstChild as HTMLElement;
        const expectedScale = 1 / zoomLevel;
        expect(element).toHaveStyle({ transform: `scale(${expectedScale})` });
        
        unmount();
      });
    });
  });
}); 