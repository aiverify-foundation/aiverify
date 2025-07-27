import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  const defaultProps = {
    content: 'Tooltip content',
    children: <button>Hover me</button>,
  };

  beforeEach(() => {
    // Mock getBoundingClientRect for positioning
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  describe('rendering', () => {
    it('renders children without tooltip initially', () => {
      render(<Tooltip {...defaultProps} />);

      expect(screen.getByText('Hover me')).toBeInTheDocument();
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    });

    it('renders tooltip content when provided', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('shows tooltip on mouse enter', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders children correctly', () => {
      render(<Tooltip {...defaultProps} />);

      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty content', () => {
      render(<Tooltip content="" children={<button>Hover me</button>} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      // Should not crash, but tooltip might not be visible
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const longContent = 'A'.repeat(1000);
      render(<Tooltip content={longContent} children={<button>Hover me</button>} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialContent = 'Tooltip with special chars: !@#$%^&*()';
      render(<Tooltip content={specialContent} children={<button>Hover me</button>} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('handles complex children', () => {
      const complexChildren = (
        <div>
          <span>Complex</span>
          <button>Button</button>
        </div>
      );

      render(<Tooltip content="Tooltip content" children={complexChildren} />);

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('positions tooltip correctly', () => {
      render(<Tooltip {...defaultProps} />);

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      const tooltip = screen.getByText('Tooltip content');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveClass('absolute');
    });
  });
}); 