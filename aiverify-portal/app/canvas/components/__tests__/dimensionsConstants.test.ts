import {
  A4_WIDTH,
  A4_HEIGHT,
  A4_MARGIN,
  GRID_ROWS,
  GRID_COLUMNS,
  GRID_WIDTH,
  GRID_ROW_HEIGHT,
  GRID_HEIGHT,
  CONTAINER_PAD,
} from '../dimensionsConstants';

describe('dimensionsConstants', () => {
  describe('A4 Dimensions', () => {
    it('exports correct A4 width', () => {
      expect(A4_WIDTH).toBe(794);
    });

    it('exports correct A4 height', () => {
      expect(A4_HEIGHT).toBe(1100);
    });

    it('exports correct A4 margin', () => {
      expect(A4_MARGIN).toBe(12);
    });
  });

  describe('Grid Configuration', () => {
    it('exports correct number of grid rows', () => {
      expect(GRID_ROWS).toBe(36);
    });

    it('exports correct number of grid columns', () => {
      expect(GRID_COLUMNS).toBe(12);
    });

    it('exports correct container padding', () => {
      expect(CONTAINER_PAD).toBe(100);
    });
  });

  describe('Calculated Grid Dimensions', () => {
    it('calculates correct grid width', () => {
      const expectedWidth = A4_WIDTH - A4_MARGIN * 2;
      expect(GRID_WIDTH).toBe(expectedWidth);
      expect(GRID_WIDTH).toBe(794 - 12 * 2);
      expect(GRID_WIDTH).toBe(770);
    });

    it('calculates correct grid height', () => {
      const expectedHeight = A4_HEIGHT - A4_MARGIN * 2;
      expect(GRID_HEIGHT).toBe(expectedHeight);
      expect(GRID_HEIGHT).toBe(1100 - 12 * 2);
      expect(GRID_HEIGHT).toBe(1076);
    });

    it('calculates correct grid row height', () => {
      const expectedRowHeight = GRID_HEIGHT / GRID_ROWS;
      expect(GRID_ROW_HEIGHT).toBe(expectedRowHeight);
      expect(GRID_ROW_HEIGHT).toBe(1076 / 36);
      expect(GRID_ROW_HEIGHT).toBeCloseTo(29.89, 2);
    });
  });

  describe('Mathematical Relationships', () => {
    it('maintains correct relationship between A4 dimensions and grid dimensions', () => {
      // Grid width should be A4 width minus margins
      expect(GRID_WIDTH).toBe(A4_WIDTH - A4_MARGIN * 2);
      
      // Grid height should be A4 height minus margins
      expect(GRID_HEIGHT).toBe(A4_HEIGHT - A4_MARGIN * 2);
      
      // Grid row height should be grid height divided by number of rows
      expect(GRID_ROW_HEIGHT).toBe(GRID_HEIGHT / GRID_ROWS);
    });

    it('ensures grid dimensions are positive', () => {
      expect(GRID_WIDTH).toBeGreaterThan(0);
      expect(GRID_HEIGHT).toBeGreaterThan(0);
      expect(GRID_ROW_HEIGHT).toBeGreaterThan(0);
    });

    it('ensures grid dimensions are smaller than A4 dimensions', () => {
      expect(GRID_WIDTH).toBeLessThan(A4_WIDTH);
      expect(GRID_HEIGHT).toBeLessThan(A4_HEIGHT);
    });

    it('ensures margins are reasonable', () => {
      expect(A4_MARGIN).toBeGreaterThan(0);
      expect(A4_MARGIN).toBeLessThan(A4_WIDTH / 2);
      expect(A4_MARGIN).toBeLessThan(A4_HEIGHT / 2);
    });
  });

  describe('Grid Layout Properties', () => {
    it('has reasonable grid dimensions for layout calculations', () => {
      // Grid should have enough rows and columns for flexible layouts
      expect(GRID_ROWS).toBeGreaterThan(10);
      expect(GRID_COLUMNS).toBeGreaterThan(6);
      
      // Grid should not be too large to cause performance issues
      expect(GRID_ROWS).toBeLessThan(100);
      expect(GRID_COLUMNS).toBeLessThan(50);
    });

    it('maintains aspect ratio considerations', () => {
      const gridAspectRatio = GRID_WIDTH / GRID_HEIGHT;
      const a4AspectRatio = A4_WIDTH / A4_HEIGHT;
      
      // Grid aspect ratio should be similar to A4 aspect ratio
      // Using a tolerance of 0.01 since margins slightly affect the ratio
      expect(gridAspectRatio).toBeCloseTo(a4AspectRatio, 1);
    });
  });

  describe('Container Padding Usage', () => {
    it('has reasonable container padding value', () => {
      expect(CONTAINER_PAD).toBeGreaterThan(0);
      expect(CONTAINER_PAD).toBeLessThan(GRID_HEIGHT / 2);
    });

    it('container padding is used for virtual space calculations', () => {
      // This constant is used for calculating virtual space at top and bottom
      // of free form content, so it should be a reasonable percentage of grid height
      const paddingPercentage = CONTAINER_PAD / GRID_HEIGHT;
      expect(paddingPercentage).toBeGreaterThan(0.05); // At least 5%
      expect(paddingPercentage).toBeLessThan(0.3); // No more than 30%
    });
  });

  describe('Export Completeness', () => {
    it('exports all necessary constants', () => {
      const exportedConstants = {
        A4_WIDTH,
        A4_HEIGHT,
        A4_MARGIN,
        GRID_ROWS,
        GRID_COLUMNS,
        GRID_WIDTH,
        GRID_ROW_HEIGHT,
        GRID_HEIGHT,
        CONTAINER_PAD,
      };

      // All constants should be defined
      Object.entries(exportedConstants).forEach(([name, value]) => {
        expect(value).toBeDefined();
        expect(typeof value).toBe('number');
        expect(value).not.toBeNaN();
      });
    });
  });

  describe('Integration with Layout Systems', () => {
    it('provides compatible dimensions for react-grid-layout', () => {
      // react-grid-layout expects positive dimensions
      expect(GRID_WIDTH).toBeGreaterThan(0);
      expect(GRID_HEIGHT).toBeGreaterThan(0);
      expect(GRID_ROW_HEIGHT).toBeGreaterThan(0);
      
      // Grid should have reasonable dimensions for responsive layouts
      expect(GRID_COLUMNS).toBe(12); // Common responsive grid system
    });

    it('supports A4 page layout requirements', () => {
      // A4 dimensions should be standard
      expect(A4_WIDTH).toBe(794); // Standard A4 width in pixels at 96 DPI
      expect(A4_HEIGHT).toBe(1100); // Standard A4 height in pixels at 96 DPI
      
      // Margins should provide adequate white space
      expect(A4_MARGIN).toBe(12); // 12px margins
    });
  });
}); 