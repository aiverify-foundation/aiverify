import React from 'react';
import { render } from '@testing-library/react';
import { GridLines } from '../gridLines';

describe('GridLines', () => {
  const defaultProps = {
    columns: 12,
    rows: 36,
    padding: 12,
  };

  describe('Rendering', () => {
    it('renders grid container with correct classes', () => {
      const { container } = render(<GridLines {...defaultProps} />);
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass(
        'absolute',
        'left-0',
        'top-0',
        'grid',
        'h-full',
        'w-full',
        'grid-cols-12',
        'grid-rows-[repeat(36,1fr)]'
      );
    });

    it('renders correct number of grid cells', () => {
      const { container } = render(<GridLines {...defaultProps} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(12 * 36); // columns * rows
    });

    it('applies custom className to container', () => {
      const { container } = render(
        <GridLines {...defaultProps} className="custom-grid" />
      );
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('custom-grid');
    });

    it('applies custom padding', () => {
      const { container } = render(<GridLines {...defaultProps} padding={20} />);
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveStyle({ padding: '20px' });
    });

    it('applies custom line color', () => {
      const customColor = '#ff0000';
      const { container } = render(
        <GridLines {...defaultProps} lineColor={customColor} />
      );
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveStyle({ borderColor: customColor });
      
      // Check that all grid cells have the custom color
      const gridCells = container.querySelectorAll('div > div > div');
      gridCells.forEach(cell => {
        expect(cell).toHaveStyle({ borderColor: customColor });
      });
    });
  });

  describe('Grid Cell Positioning', () => {
    it('correctly identifies right edge cells', () => {
      const { container } = render(<GridLines columns={3} rows={3} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      
      // Right edge cells should be at indices 2, 5, 8 (0-indexed, every 3rd cell)
      const rightEdgeIndices = [2, 5, 8];
      rightEdgeIndices.forEach(index => {
        expect(gridCells[index]).toHaveClass('border-r');
      });
    });

    it('correctly identifies left edge cells', () => {
      const { container } = render(<GridLines columns={3} rows={3} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      
      // Left edge cells should be at indices 0, 3, 6 (0-indexed, every 3rd cell)
      const leftEdgeIndices = [0, 3, 6];
      leftEdgeIndices.forEach(index => {
        expect(gridCells[index]).toHaveClass('border-l');
      });
    });

    it('correctly identifies top edge cells', () => {
      const { container } = render(<GridLines columns={3} rows={3} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      
      // Top edge cells should be at indices 0, 1, 2 (first row)
      const topEdgeIndices = [0, 1, 2];
      topEdgeIndices.forEach(index => {
        expect(gridCells[index]).toHaveClass('border-t');
      });
    });

    it('correctly identifies bottom edge cells', () => {
      const { container } = render(<GridLines columns={3} rows={3} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      
      // Bottom edge cells should be at indices 6, 7, 8 (last row)
      const bottomEdgeIndices = [6, 7, 8];
      bottomEdgeIndices.forEach(index => {
        expect(gridCells[index]).toHaveClass('border-b');
      });
    });

    it('handles corner cells correctly', () => {
      const { container } = render(<GridLines columns={3} rows={3} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      
      // Top-left corner (index 0)
      expect(gridCells[0]).toHaveClass('border-t', 'border-l');
      
      // Top-right corner (index 2)
      expect(gridCells[2]).toHaveClass('border-t', 'border-r');
      
      // Bottom-left corner (index 6)
      expect(gridCells[6]).toHaveClass('border-b', 'border-l');
      
      // Bottom-right corner (index 8)
      expect(gridCells[8]).toHaveClass('border-b', 'border-r');
    });
  });

  describe('Grid Cell Styling', () => {
    it('applies base border classes to all cells', () => {
      const { container } = render(<GridLines columns={3} rows={3} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      gridCells.forEach(cell => {
        expect(cell).toHaveClass('border-b', 'border-r');
      });
    });

    it('applies correct grid template styles', () => {
      const { container } = render(<GridLines columns={12} rows={36} padding={12} />);
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid-cols-12', 'grid-rows-[repeat(36,1fr)]');
    });
  });

  describe('Different Grid Sizes', () => {
    it('handles small grid', () => {
      const { container } = render(<GridLines columns={2} rows={2} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(4);
    });

    it('handles large grid', () => {
      const { container } = render(<GridLines columns={20} rows={20} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(400);
    });

    it('handles single column grid', () => {
      const { container } = render(<GridLines columns={1} rows={5} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(5);
      
      // All cells should be left and right edge
      gridCells.forEach(cell => {
        expect(cell).toHaveClass('border-l', 'border-r');
      });
    });

    it('handles single row grid', () => {
      const { container } = render(<GridLines columns={5} rows={1} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(5);
      
      // All cells should be top and bottom edge
      gridCells.forEach(cell => {
        expect(cell).toHaveClass('border-t', 'border-b');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero columns', () => {
      const { container } = render(<GridLines columns={0} rows={5} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(0);
    });

    it('handles zero rows', () => {
      const { container } = render(<GridLines columns={5} rows={0} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(0);
    });

    it('handles negative values gracefully', () => {
      const { container } = render(<GridLines columns={-1} rows={-1} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(0);
    });

    it('handles very large numbers', () => {
      const { container } = render(<GridLines columns={100} rows={100} padding={12} />);
      
      const gridCells = container.querySelectorAll('div > div > div');
      expect(gridCells).toHaveLength(10000);
    });

    it('handles decimal padding', () => {
      const { container } = render(<GridLines {...defaultProps} padding={12.5} />);
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveStyle({ padding: '12.5px' });
    });
  });

  describe('Integration with Layout', () => {
    it('works with default A4 dimensions', () => {
      const { container } = render(<GridLines columns={12} rows={36} padding={12} />);
      
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid-cols-12', 'grid-rows-[repeat(36,1fr)]');
    });

    it('maintains aspect ratio considerations', () => {
      const { container } = render(<GridLines columns={12} rows={36} padding={12} />);
      
      const gridContainer = container.firstChild as HTMLElement;
      // Should maintain the standard 12x36 grid layout
      expect(gridContainer).toHaveClass('grid-cols-12', 'grid-rows-[repeat(36,1fr)]');
    });
  });
}); 