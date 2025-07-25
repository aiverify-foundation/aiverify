import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControl } from '../zoomControl';

// Mock the icon components
jest.mock('@remixicon/react', () => ({
  RiZoomInLine: ({ className }: any) => (
    <div className={className} data-testid="zoom-in-icon">
      Zoom In
    </div>
  ),
  RiZoomOutLine: ({ className }: any) => (
    <div className={className} data-testid="zoom-out-icon">
      Zoom Out
    </div>
  ),
}));

describe('ZoomControl', () => {
  const defaultProps = {
    zoomLevel: 1,
    onZoomReset: jest.fn(),
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all zoom control buttons', () => {
      render(<ZoomControl {...defaultProps} />);
      
      expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
      expect(screen.getByTitle('Reset zoom')).toBeInTheDocument();
    });

    it('displays current zoom level as percentage', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={1.5} />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ZoomControl {...defaultProps} className="custom-zoom" />
      );
      
      const zoomControl = container.firstChild as HTMLElement;
      expect(zoomControl).toHaveClass('custom-zoom');
    });
  });

  describe('User Interactions', () => {
    it('calls onZoomIn when zoom in button is clicked', () => {
      render(<ZoomControl {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('zoom-in-button'));
      
      expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
    });

    it('calls onZoomOut when zoom out button is clicked', () => {
      render(<ZoomControl {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('zoom-out-button'));
      
      expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('calls onZoomReset when reset button is clicked', () => {
      render(<ZoomControl {...defaultProps} />);
      
      fireEvent.click(screen.getByTitle('Reset zoom'));
      
      expect(defaultProps.onZoomReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button States', () => {
    it('disables zoom in button when at maximum zoom', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={2} />);
      
      const zoomInButton = screen.getByTestId('zoom-in-button');
      expect(zoomInButton).toBeDisabled();
      expect(zoomInButton).toHaveClass('disabled:opacity-50');
    });

    it('disables zoom out button when at minimum zoom', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={0.25} />);
      
      const zoomOutButton = screen.getByTestId('zoom-out-button');
      expect(zoomOutButton).toBeDisabled();
      expect(zoomOutButton).toHaveClass('disabled:opacity-50');
    });

    it('enables both buttons when zoom level is in range', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={1} />);
      
      const zoomInButton = screen.getByTestId('zoom-in-button');
      const zoomOutButton = screen.getByTestId('zoom-out-button');
      
      expect(zoomInButton).not.toBeDisabled();
      expect(zoomOutButton).not.toBeDisabled();
    });

    it('enables zoom in button when below maximum zoom', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={1.9} />);
      
      const zoomInButton = screen.getByTestId('zoom-in-button');
      expect(zoomInButton).not.toBeDisabled();
    });

    it('enables zoom out button when above minimum zoom', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={0.3} />);
      
      const zoomOutButton = screen.getByTestId('zoom-out-button');
      expect(zoomOutButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zoom level of 0', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      const zoomOutButton = screen.getByTestId('zoom-out-button');
      expect(zoomOutButton).toBeDisabled();
    });

    it('handles very large zoom levels', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={5} />);
      
      expect(screen.getByText('500%')).toBeInTheDocument();
      const zoomInButton = screen.getByTestId('zoom-in-button');
      expect(zoomInButton).toBeDisabled();
    });

    it('handles decimal zoom levels correctly', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={0.75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('handles negative zoom levels', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={-0.5} />);
      
      expect(screen.getByText('-50%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper title attributes for all buttons', () => {
      render(<ZoomControl {...defaultProps} />);
      
      expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset zoom')).toBeInTheDocument();
    });

    it('maintains button functionality when disabled', () => {
      render(<ZoomControl {...defaultProps} zoomLevel={2} />);
      
      const zoomInButton = screen.getByTestId('zoom-in-button');
      fireEvent.click(zoomInButton);
      
      // Should not call the function when disabled
      expect(defaultProps.onZoomIn).not.toHaveBeenCalled();
    });
  });

  describe('Integration with useZoom hook', () => {
    it('works correctly with typical zoom levels from useZoom hook', () => {
      const zoomLevels = [0.25, 0.4, 0.55, 0.7, 0.85, 1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2];
      
      zoomLevels.forEach(zoomLevel => {
        const { unmount } = render(
          <ZoomControl {...defaultProps} zoomLevel={zoomLevel} />
        );
        
        const expectedPercentage = Math.round(zoomLevel * 100);
        expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument();
        
        unmount();
      });
    });
  });
}); 