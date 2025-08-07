import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplitPane from '../SplitPane';

describe('SplitPane', () => {
  const mockLeftPane = <div data-testid="left-pane-content">Left Pane Content</div>;
  const mockRightPane = <div data-testid="right-pane-content">Right Pane Content</div>;

  const defaultProps = {
    leftPane: mockLeftPane,
    rightPane: mockRightPane,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SplitPane {...defaultProps} />);
    
    expect(screen.getByTestId('left-pane-content')).toBeInTheDocument();
    expect(screen.getByTestId('right-pane-content')).toBeInTheDocument();
  });

  it('renders both left and right panes', () => {
    render(<SplitPane {...defaultProps} />);
    
    const leftPane = screen.getByTestId('left-pane-content');
    const rightPane = screen.getByTestId('right-pane-content');
    
    expect(leftPane).toBeInTheDocument();
    expect(rightPane).toBeInTheDocument();
    expect(leftPane).toHaveTextContent('Left Pane Content');
    expect(rightPane).toHaveTextContent('Right Pane Content');
  });

  it('has correct main container styling', () => {
    render(<SplitPane {...defaultProps} />);
    
    const mainContainer = screen.getByRole('region', { name: 'Split pane container' });
    expect(mainContainer).toHaveClass('flex', 'h-[calc(100vh-150px)]');
  });

  it('has correct left pane styling', () => {
    render(<SplitPane {...defaultProps} />);
    
    const leftPane = screen.getByRole('region', { name: 'Left pane content' });
    expect(leftPane).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-2/5', 'p-2');
  });

  it('has correct right pane styling', () => {
    render(<SplitPane {...defaultProps} />);
    
    const rightPane = screen.getByRole('region', { name: 'Right pane content' });
    expect(rightPane).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-3/5', 'overflow-y-auto', 'p-3');
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<SplitPane {...defaultProps} />);
    
    expect(screen.getByRole('region', { name: 'Split pane container' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Left pane content' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Right pane content' })).toBeInTheDocument();
  });

  it('renders complex content in left pane', () => {
    const complexLeftPane = (
      <div>
        <h2>Left Title</h2>
        <p>Left paragraph</p>
        <button>Left Button</button>
      </div>
    );

    render(<SplitPane {...defaultProps} leftPane={complexLeftPane} />);
    
    expect(screen.getByText('Left Title')).toBeInTheDocument();
    expect(screen.getByText('Left paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Left Button' })).toBeInTheDocument();
  });

  it('renders complex content in right pane', () => {
    const complexRightPane = (
      <div>
        <h2>Right Title</h2>
        <p>Right paragraph</p>
        <button>Right Button</button>
      </div>
    );

    render(<SplitPane {...defaultProps} rightPane={complexRightPane} />);
    
    expect(screen.getByText('Right Title')).toBeInTheDocument();
    expect(screen.getByText('Right paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Right Button' })).toBeInTheDocument();
  });

  it('renders multiple elements in left pane', () => {
    const multipleLeftPane = (
      <>
        <div data-testid="left-item-1">Item 1</div>
        <div data-testid="left-item-2">Item 2</div>
        <div data-testid="left-item-3">Item 3</div>
      </>
    );

    render(<SplitPane {...defaultProps} leftPane={multipleLeftPane} />);
    
    expect(screen.getByTestId('left-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('left-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('left-item-3')).toBeInTheDocument();
  });

  it('renders multiple elements in right pane', () => {
    const multipleRightPane = (
      <>
        <div data-testid="right-item-1">Item 1</div>
        <div data-testid="right-item-2">Item 2</div>
        <div data-testid="right-item-3">Item 3</div>
      </>
    );

    render(<SplitPane {...defaultProps} rightPane={multipleRightPane} />);
    
    expect(screen.getByTestId('right-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('right-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('right-item-3')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    render(<SplitPane leftPane={null} rightPane={null} />);
    
    const mainContainer = screen.getByRole('region', { name: 'Split pane container' });
    expect(mainContainer).toBeInTheDocument();
  });

  it('handles undefined content gracefully', () => {
    render(<SplitPane leftPane={undefined} rightPane={undefined} />);
    
    const mainContainer = screen.getByRole('region', { name: 'Split pane container' });
    expect(mainContainer).toBeInTheDocument();
  });

  it('handles text content', () => {
    render(<SplitPane leftPane="Left text" rightPane="Right text" />);
    
    expect(screen.getByText('Left text')).toBeInTheDocument();
    expect(screen.getByText('Right text')).toBeInTheDocument();
  });

  it('handles number content', () => {
    render(<SplitPane leftPane={123} rightPane={456} />);
    
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
  });

  it('maintains proper semantic structure', () => {
    render(<SplitPane {...defaultProps} />);
    
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(3); // Main container + left + right
    
    const mainRegion = regions[0];
    expect(mainRegion).toHaveAttribute('aria-label', 'Split pane container');
  });

  it('has proper flex layout structure', () => {
    render(<SplitPane {...defaultProps} />);
    
    const mainContainer = screen.getByRole('region', { name: 'Split pane container' });
    expect(mainContainer).toHaveClass('flex');
  });

  it('applies correct height calculation', () => {
    render(<SplitPane {...defaultProps} />);
    
    const mainContainer = screen.getByRole('region', { name: 'Split pane container' });
    expect(mainContainer).toHaveClass('h-[calc(100vh-150px)]');
  });

  it('has proper flex basis for panes', () => {
    render(<SplitPane {...defaultProps} />);
    
    const leftPane = screen.getByRole('region', { name: 'Left pane content' });
    const rightPane = screen.getByRole('region', { name: 'Right pane content' });
    
    expect(leftPane).toHaveClass('basis-2/5'); // 40% width
    expect(rightPane).toHaveClass('basis-3/5'); // 60% width
  });

  it('has proper flex properties for panes', () => {
    render(<SplitPane {...defaultProps} />);
    
    const leftPane = screen.getByRole('region', { name: 'Left pane content' });
    const rightPane = screen.getByRole('region', { name: 'Right pane content' });
    
    expect(leftPane).toHaveClass('flex-shrink-0', 'flex-grow');
    expect(rightPane).toHaveClass('flex-shrink-0', 'flex-grow');
  });

  it('has proper padding for panes', () => {
    render(<SplitPane {...defaultProps} />);
    
    const leftPane = screen.getByRole('region', { name: 'Left pane content' });
    const rightPane = screen.getByRole('region', { name: 'Right pane content' });
    
    expect(leftPane).toHaveClass('p-2');
    expect(rightPane).toHaveClass('p-3');
  });

  it('has proper overflow handling for right pane', () => {
    render(<SplitPane {...defaultProps} />);
    
    const rightPane = screen.getByRole('region', { name: 'Right pane content' });
    expect(rightPane).toHaveClass('overflow-y-auto');
  });

  it('maintains accessibility with screen readers', () => {
    render(<SplitPane {...defaultProps} />);
    
    // All regions should be properly labeled
    const regions = screen.getAllByRole('region');
    regions.forEach(region => {
      expect(region).toHaveAttribute('aria-label');
    });
  });

  it('handles dynamic content changes', () => {
    const { rerender } = render(<SplitPane {...defaultProps} />);
    
    const newLeftPane = <div data-testid="new-left">New Left Content</div>;
    const newRightPane = <div data-testid="new-right">New Right Content</div>;
    
    rerender(<SplitPane leftPane={newLeftPane} rightPane={newRightPane} />);
    
    expect(screen.getByTestId('new-left')).toBeInTheDocument();
    expect(screen.getByTestId('new-right')).toBeInTheDocument();
    expect(screen.queryByTestId('left-pane-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-pane-content')).not.toBeInTheDocument();
  });

  it('maintains layout structure with different content types', () => {
    render(<SplitPane {...defaultProps} />);
    
    const mainContainer = screen.getByRole('region', { name: 'Split pane container' });
    const leftPane = screen.getByRole('region', { name: 'Left pane content' });
    const rightPane = screen.getByRole('region', { name: 'Right pane content' });
    
    // Verify the structure is maintained
    expect(mainContainer).toContainElement(leftPane);
    expect(mainContainer).toContainElement(rightPane);
  });
}); 