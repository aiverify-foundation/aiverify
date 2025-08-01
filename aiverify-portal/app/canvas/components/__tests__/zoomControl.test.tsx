import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControl } from '../zoomControl';

describe('ZoomControl', () => {
  const mockOnZoomIn = jest.fn();
  const mockOnZoomOut = jest.fn();
  const mockOnZoomReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders zoom control with all buttons', () => {
    render(
      <ZoomControl
        zoomLevel={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
    expect(screen.getByTestId('reset-zoom-button')).toBeInTheDocument();
  });

  it('displays correct zoom percentage', () => {
    render(
      <ZoomControl
        zoomLevel={1.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    expect(screen.getByTestId('reset-zoom-button')).toHaveTextContent('150%');
  });

  it('calls onZoomIn when zoom in button is clicked', () => {
    render(
      <ZoomControl
        zoomLevel={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    fireEvent.click(screen.getByTestId('zoom-in-button'));
    expect(mockOnZoomIn).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomOut when zoom out button is clicked', () => {
    render(
      <ZoomControl
        zoomLevel={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    fireEvent.click(screen.getByTestId('zoom-out-button'));
    expect(mockOnZoomOut).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomReset when reset button is clicked', () => {
    render(
      <ZoomControl
        zoomLevel={1.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    fireEvent.click(screen.getByTestId('reset-zoom-button'));
    expect(mockOnZoomReset).toHaveBeenCalledTimes(1);
  });

  it('disables zoom in button when at maximum zoom', () => {
    render(
      <ZoomControl
        zoomLevel={2}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    const zoomInButton = screen.getByTestId('zoom-in-button');
    expect(zoomInButton).toBeDisabled();
  });

  it('disables zoom out button when at minimum zoom', () => {
    render(
      <ZoomControl
        zoomLevel={0.25}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    const zoomOutButton = screen.getByTestId('zoom-out-button');
    expect(zoomOutButton).toBeDisabled();
  });

  it('enables zoom in button when below maximum zoom', () => {
    render(
      <ZoomControl
        zoomLevel={1.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    const zoomInButton = screen.getByTestId('zoom-in-button');
    expect(zoomInButton).not.toBeDisabled();
  });

  it('enables zoom out button when above minimum zoom', () => {
    render(
      <ZoomControl
        zoomLevel={0.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    const zoomOutButton = screen.getByTestId('zoom-out-button');
    expect(zoomOutButton).not.toBeDisabled();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-zoom-control';
    render(
      <ZoomControl
        zoomLevel={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
        className={customClass}
      />
    );

    const container = screen.getByTestId('zoom-in-button').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('handles decimal zoom levels correctly', () => {
    render(
      <ZoomControl
        zoomLevel={0.75}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    expect(screen.getByTestId('reset-zoom-button')).toHaveTextContent('75%');
  });

  it('handles very small zoom levels', () => {
    render(
      <ZoomControl
        zoomLevel={0.26}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    expect(screen.getByTestId('reset-zoom-button')).toHaveTextContent('26%');
  });

  it('handles very large zoom levels', () => {
    render(
      <ZoomControl
        zoomLevel={1.99}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onZoomReset={mockOnZoomReset}
      />
    );

    expect(screen.getByTestId('reset-zoom-button')).toHaveTextContent('199%');
  });
}); 