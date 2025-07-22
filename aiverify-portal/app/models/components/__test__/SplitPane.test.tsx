import React from 'react';
import { render, screen } from '@testing-library/react';
import SplitPane from '../SplitPane';

describe('SplitPane', () => {
  const mockLeftPane = <div data-testid="left-pane">Left Content</div>;
  const mockRightPane = <div data-testid="right-pane">Right Content</div>;

  it('renders both panes with correct content', () => {
    render(<SplitPane leftPane={mockLeftPane} rightPane={mockRightPane} />);
    
    expect(screen.getByTestId('left-pane')).toBeInTheDocument();
    expect(screen.getByTestId('right-pane')).toBeInTheDocument();
    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });

  it('applies correct CSS classes to container', () => {
    render(<SplitPane leftPane={mockLeftPane} rightPane={mockRightPane} />);
    
    const container = screen.getByTestId('left-pane').parentElement?.parentElement;
    expect(container).toHaveClass('flex', 'h-[calc(100vh-150px)]');
  });

  it('applies correct CSS classes to left pane', () => {
    render(<SplitPane leftPane={mockLeftPane} rightPane={mockRightPane} />);
    
    const leftPane = screen.getByTestId('left-pane').parentElement;
    expect(leftPane).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-3/5', 'p-2');
  });

  it('applies correct CSS classes to right pane', () => {
    render(<SplitPane leftPane={mockLeftPane} rightPane={mockRightPane} />);
    
    const rightPane = screen.getByTestId('right-pane').parentElement;
    expect(rightPane).toHaveClass('basis-2/5', 'overflow-y-auto', 'p-2');
  });

  it('renders complex React components in panes', () => {
    const complexLeftPane = (
      <div data-testid="complex-left">
        <h1>Title</h1>
        <p>Description</p>
        <button>Click me</button>
      </div>
    );
    
    const complexRightPane = (
      <div data-testid="complex-right">
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    );

    render(<SplitPane leftPane={complexLeftPane} rightPane={complexRightPane} />);
    
    expect(screen.getByTestId('complex-left')).toBeInTheDocument();
    expect(screen.getByTestId('complex-right')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders empty panes correctly', () => {
    render(<SplitPane leftPane={null} rightPane={null} />);
    
    // When panes are null, the container should still be rendered with the correct structure
    const container = document.querySelector('.flex.h-\\[calc\\(100vh-150px\\)\\]');
    expect(container).toBeInTheDocument();
    
    // Should have two child divs for left and right panes
    const children = container?.children;
    expect(children).toHaveLength(2);
  });

  it('maintains proper flex layout structure', () => {
    render(<SplitPane leftPane={mockLeftPane} rightPane={mockRightPane} />);
    
    const container = screen.getByTestId('left-pane').parentElement?.parentElement;
    const leftPane = screen.getByTestId('left-pane').parentElement;
    const rightPane = screen.getByTestId('right-pane').parentElement;
    
    expect(container).toHaveClass('flex');
    expect(leftPane).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-3/5');
    expect(rightPane).toHaveClass('basis-2/5');
  });

  it('applies correct height calculation', () => {
    render(<SplitPane leftPane={mockLeftPane} rightPane={mockRightPane} />);
    
    const container = screen.getByTestId('left-pane').parentElement?.parentElement;
    expect(container).toHaveClass('h-[calc(100vh-150px)]');
  });
}); 