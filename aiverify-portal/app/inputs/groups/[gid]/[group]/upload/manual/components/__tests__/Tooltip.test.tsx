import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  const defaultProps = {
    content: 'This is a tooltip message',
    children: <button data-testid="trigger">Hover me</button>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children without tooltip initially', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Hover me');
      
      // Tooltip should not be visible initially
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
    });

    it('renders with different types of children', () => {
      const { rerender } = render(
        <Tooltip content="Test tooltip">
          <span data-testid="span-child">Span child</span>
        </Tooltip>
      );

      expect(screen.getByTestId('span-child')).toBeInTheDocument();
      expect(screen.getByText('Span child')).toBeInTheDocument();

      rerender(
        <Tooltip content="Test tooltip">
          <div data-testid="div-child">Div child</div>
        </Tooltip>
      );

      expect(screen.getByTestId('div-child')).toBeInTheDocument();
      expect(screen.getByText('Div child')).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <Tooltip content="Complex tooltip">
          <div data-testid="complex-child">
            <span>Nested</span>
            <button>Button</button>
          </div>
        </Tooltip>
      );

      const complexChild = screen.getByTestId('complex-child');
      expect(complexChild).toBeInTheDocument();
      expect(complexChild).toHaveTextContent('Nested');
      expect(complexChild).toHaveTextContent('Button');
    });

    it('renders with empty content', () => {
      render(
        <Tooltip content="">
          <button data-testid="empty-tooltip">Empty tooltip</button>
        </Tooltip>
      );

      const trigger = screen.getByTestId('empty-tooltip');
      expect(trigger).toBeInTheDocument();
      
      // Trigger mouse enter to show tooltip
      fireEvent.mouseEnter(trigger);
      
      // Empty content should not render as a visible tooltip
      const tooltipContainer = document.querySelector('.absolute');
      expect(tooltipContainer).toBeInTheDocument();
      expect(tooltipContainer).toHaveTextContent('');
    });

    it('renders with long content', () => {
      const longContent = 'This is a very long tooltip message that should wrap properly and display correctly in the tooltip component';
      render(
        <Tooltip content={longContent}>
          <button data-testid="long-tooltip">Long tooltip</button>
        </Tooltip>
      );

      const trigger = screen.getByTestId('long-tooltip');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Mouse Events', () => {
    it('shows tooltip on mouse enter', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      
      // Tooltip should not be visible initially
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
      
      // Trigger mouse enter
      fireEvent.mouseEnter(trigger);
      
      // Tooltip should now be visible
      expect(screen.getByText('This is a tooltip message')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      
      // Show tooltip first
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('This is a tooltip message')).toBeInTheDocument();
      
      // Hide tooltip
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
    });

    it('handles multiple mouse enter/leave events', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      
      // First enter
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('This is a tooltip message')).toBeInTheDocument();
      
      // First leave
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
      
      // Second enter
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('This is a tooltip message')).toBeInTheDocument();
      
      // Second leave
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
    });

    it('handles rapid mouse enter/leave events', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      
      // Rapid events
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      
      // Should end with tooltip hidden
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Positioning and Styling', () => {
    it('renders tooltip with correct CSS classes when visible', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseEnter(trigger);

      const tooltip = screen.getByText('This is a tooltip message');
      expect(tooltip).toBeInTheDocument();
      
      // Check for expected CSS classes
      expect(tooltip).toHaveClass(
        'absolute',
        'left-1/2',
        'top-full',
        'mt-1',
        'w-max',
        '-translate-x-1/2',
        'rounded',
        'bg-gray-800',
        'px-3',
        'py-2',
        'text-sm',
        'text-white',
        'shadow-lg'
      );
    });

    it('renders tooltip with correct positioning classes', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseEnter(trigger);

      const tooltip = screen.getByText('This is a tooltip message');
      const tooltipParent = tooltip.parentElement;
      
      // Check that the tooltip container has the correct positioning class
      expect(tooltipParent).toHaveClass('relative', 'inline-block');
    });
  });

  describe('Content Handling', () => {
    it('displays different content correctly', () => {
      const { rerender } = render(
        <Tooltip content="First tooltip">
          <button data-testid="trigger">Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('First tooltip')).toBeInTheDocument();

      // Change content
      rerender(
        <Tooltip content="Second tooltip">
          <button data-testid="trigger">Hover me</button>
        </Tooltip>
      );

      // Tooltip should update with new content
      expect(screen.getByText('Second tooltip')).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialContent = 'Tooltip with special chars: & < > " \'';
      render(
        <Tooltip content={specialContent}>
          <button data-testid="trigger">Special chars</button>
        </Tooltip>
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseEnter(trigger);
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('handles HTML-like content as plain text', () => {
      const htmlContent = '<script>alert("xss")</script><div>Content</div>';
      render(
        <Tooltip content={htmlContent}>
          <button data-testid="trigger">HTML content</button>
        </Tooltip>
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseEnter(trigger);
      
      // Content should be rendered as plain text, not as HTML
      expect(screen.getByText(htmlContent)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      render(
        <Tooltip content="Test tooltip">
          {null}
        </Tooltip>
      );

      // Component should render without crashing
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      render(
        <Tooltip content="Test tooltip">
          {undefined}
        </Tooltip>
      );

      // Component should render without crashing
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(
        <Tooltip content="Test tooltip">
          {true}
        </Tooltip>
      );

      // Component should render without crashing
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });

    it('handles number children', () => {
      render(
        <Tooltip content="Test tooltip">
          {42}
        </Tooltip>
      );

      // Component should render without crashing
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles array children', () => {
      render(
        <Tooltip content="Test tooltip">
          {[<span key="1">First</span>, <span key="2">Second</span>]}
        </Tooltip>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains focus management', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      
      // Focus should remain on trigger
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
      
      fireEvent.mouseEnter(trigger);
      expect(document.activeElement).toBe(trigger);
      
      fireEvent.mouseLeave(trigger);
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('State Management', () => {
    it('correctly manages visible state', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByTestId('trigger');
      
      // Initial state should be false
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
      
      // State should change to true on mouse enter
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('This is a tooltip message')).toBeInTheDocument();
      
      // State should change back to false on mouse leave
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByText('This is a tooltip message')).not.toBeInTheDocument();
    });

    it('handles state changes correctly with multiple triggers', () => {
      render(
        <div>
          <Tooltip content="First tooltip">
            <button data-testid="trigger1">First</button>
          </Tooltip>
          <Tooltip content="Second tooltip">
            <button data-testid="trigger2">Second</button>
          </Tooltip>
        </div>
      );

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');
      
      // Show first tooltip
      fireEvent.mouseEnter(trigger1);
      expect(screen.getByText('First tooltip')).toBeInTheDocument();
      expect(screen.queryByText('Second tooltip')).not.toBeInTheDocument();
      
      // Hide first, show second
      fireEvent.mouseLeave(trigger1);
      fireEvent.mouseEnter(trigger2);
      expect(screen.queryByText('First tooltip')).not.toBeInTheDocument();
      expect(screen.getByText('Second tooltip')).toBeInTheDocument();
    });
  });
}); 