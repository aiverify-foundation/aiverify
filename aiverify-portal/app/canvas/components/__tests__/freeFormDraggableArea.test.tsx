import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FreeFormDraggableArea } from '../freeFormDraggableArea';

describe('FreeFormDraggableArea', () => {
  const mockRef = React.createRef<HTMLDivElement>();
  const mockProps = {
    ref: mockRef,
    pagesLength: 3,
    zoomLevel: 1,
    contentWrapperMinHeight: 800,
    children: <div data-testid="test-children">Test Content</div>,
  };

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component with children', () => {
    render(<FreeFormDraggableArea {...mockProps} />);
    
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    const { container } = render(<FreeFormDraggableArea {...mockProps} />);
    
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('relative', 'flex', 'h-full', 'w-full', 'flex-1', 'flex-col', 'gap-2');
    
    const freeFormArea = container.querySelector('#freeFormArea');
    expect(freeFormArea).toBeInTheDocument();
    expect(freeFormArea).toHaveClass('custom-scrollbar', 'relative', 'h-full', 'cursor-grab', 'overflow-auto', 'bg-slate-100');
    
    const contentWrapper = container.querySelector('#contentWrapper');
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toHaveClass('flex', 'w-full', 'justify-center', 'transition-all', 'duration-200', 'ease-out');
  });

  it('applies correct styles based on props', () => {
    const { container } = render(<FreeFormDraggableArea {...mockProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });

  it('handles single page layout correctly', () => {
    const singlePageProps = {
      ...mockProps,
      pagesLength: 1,
    };
    
    const { container } = render(<FreeFormDraggableArea {...singlePageProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });

  it('handles different zoom levels', () => {
    const zoomProps = {
      ...mockProps,
      zoomLevel: 0.5,
    };
    
    const { container } = render(<FreeFormDraggableArea {...zoomProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });

  it('handles mouse down events on non-grid elements', () => {
    const onMouseDown = jest.fn();
    const propsWithHandlers = {
      ...mockProps,
      onMouseDown,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    fireEvent.mouseDown(freeFormArea!);
    
    expect(onMouseDown).toHaveBeenCalled();
  });

  it('does not trigger drag on grid elements', () => {
    const onMouseDown = jest.fn();
    const propsWithHandlers = {
      ...mockProps,
      onMouseDown,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    // Create a mock grid element
    const gridElement = document.createElement('div');
    gridElement.className = 'react-grid-item';
    container.appendChild(gridElement);
    
    fireEvent.mouseDown(gridElement);
    
    expect(onMouseDown).not.toHaveBeenCalled();
  });

  it('does not trigger drag on grid component wrappers', () => {
    const onMouseDown = jest.fn();
    const propsWithHandlers = {
      ...mockProps,
      onMouseDown,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    // Create a mock grid component wrapper
    const wrapperElement = document.createElement('div');
    wrapperElement.className = 'grid-comp-wrapper';
    container.appendChild(wrapperElement);
    
    fireEvent.mouseDown(wrapperElement);
    
    expect(onMouseDown).not.toHaveBeenCalled();
  });

  it('handles mouse move events during drag', () => {
    const onMouseMove = jest.fn();
    const propsWithHandlers = {
      ...mockProps,
      onMouseMove,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    
    // Start drag
    fireEvent.mouseDown(freeFormArea!);
    
    // Move mouse
    fireEvent.mouseMove(freeFormArea!, { clientX: 100, clientY: 100 });
    
    expect(onMouseMove).toHaveBeenCalled();
  });

  it('handles mouse up events', () => {
    const onMouseUp = jest.fn();
    const propsWithHandlers = {
      ...mockProps,
      onMouseUp,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    fireEvent.mouseUp(freeFormArea!);
    
    expect(onMouseUp).toHaveBeenCalled();
  });

  it('handles mouse leave events', () => {
    const onMouseLeave = jest.fn();
    const propsWithHandlers = {
      ...mockProps,
      onMouseLeave,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    fireEvent.mouseLeave(freeFormArea!);
    
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('updates cursor style during drag', () => {
    const { container } = render(<FreeFormDraggableArea {...mockProps} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    
    // Start drag
    fireEvent.mouseDown(freeFormArea!);
    
    // Move mouse to trigger drag state
    fireEvent.mouseMove(freeFormArea!, { clientX: 100, clientY: 100 });
    
    expect(contentWrapper).toHaveStyle({ cursor: 'grabbing' });
  });

  it('resets cursor style after drag ends', () => {
    const { container } = render(<FreeFormDraggableArea {...mockProps} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    
    // Start drag
    fireEvent.mouseDown(freeFormArea!);
    
    // Move mouse
    fireEvent.mouseMove(freeFormArea!, { clientX: 100, clientY: 100 });
    
    // End drag
    fireEvent.mouseUp(freeFormArea!);
    
    expect(contentWrapper).toHaveStyle({ cursor: 'grab' });
  });

  it('handles position updates during drag', () => {
    const { container } = render(<FreeFormDraggableArea {...mockProps} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    
    // Start drag
    fireEvent.mouseDown(freeFormArea!);
    
    // Move mouse
    fireEvent.mouseMove(freeFormArea!, { clientX: 100, clientY: 100 });
    
    // Check that transform has been updated
    const transform = contentWrapper.style.transform;
    expect(transform).not.toBe('scale(1) translate(0px, 0px)');
  });

  it('handles different content wrapper min heights', () => {
    const customHeightProps = {
      ...mockProps,
      contentWrapperMinHeight: 1200,
    };
    
    const { container } = render(<FreeFormDraggableArea {...customHeightProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({ minHeight: '1200px' });
  });

  it('maintains proper event handling chain', () => {
    const onMouseDown = jest.fn();
    const onMouseMove = jest.fn();
    const onMouseUp = jest.fn();
    const onMouseLeave = jest.fn();
    
    const propsWithHandlers = {
      ...mockProps,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    };
    
    const { container } = render(<FreeFormDraggableArea {...propsWithHandlers} />);
    
    const freeFormArea = container.querySelector('#freeFormArea');
    
    // Test complete drag cycle
    fireEvent.mouseDown(freeFormArea!);
    expect(onMouseDown).toHaveBeenCalled();
    
    fireEvent.mouseMove(freeFormArea!, { clientX: 50, clientY: 50 });
    expect(onMouseMove).toHaveBeenCalled();
    
    fireEvent.mouseUp(freeFormArea!);
    expect(onMouseUp).toHaveBeenCalled();
    
    fireEvent.mouseLeave(freeFormArea!);
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('handles edge cases with zero zoom level', () => {
    const zeroZoomProps = {
      ...mockProps,
      zoomLevel: 0,
    };
    
    const { container } = render(<FreeFormDraggableArea {...zeroZoomProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });

  it('handles edge cases with very high zoom level', () => {
    const highZoomProps = {
      ...mockProps,
      zoomLevel: 5,
    };
    
    const { container } = render(<FreeFormDraggableArea {...highZoomProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });

  it('handles edge cases with zero pages length', () => {
    const zeroPagesProps = {
      ...mockProps,
      pagesLength: 0,
    };
    
    const { container } = render(<FreeFormDraggableArea {...zeroPagesProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });

  it('handles edge cases with negative pages length', () => {
    const negativePagesProps = {
      ...mockProps,
      pagesLength: -1,
    };
    
    const { container } = render(<FreeFormDraggableArea {...negativePagesProps} />);
    
    const contentWrapper = container.querySelector('#contentWrapper') as HTMLElement;
    expect(contentWrapper).toHaveStyle({
      minHeight: '800px',
    });
  });
}); 