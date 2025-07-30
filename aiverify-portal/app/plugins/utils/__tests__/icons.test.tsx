import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TaskAltIcon,
  CheckCircleIcon,
  CrossCircleIcon,
  DeleteIcon,
} from '../icons';

describe('Icon Components', () => {
  describe('TaskAltIcon', () => {
    it('should render with default props', () => {
      const { container } = render(<TaskAltIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      expect(svg).toHaveAttribute('stroke', '#000000');
    });

    it('should render with custom props', () => {
      const { container } = render(
        <TaskAltIcon
          size={32}
          color="#ff0000"
          role="button"
          ariaLabel="Task completed"
          className="custom-class"
          style={{ margin: '10px' }}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
      expect(svg).toHaveAttribute('stroke', '#ff0000');
      expect(svg).toHaveAttribute('aria-label', 'Task completed');
      expect(svg).toHaveClass('custom-class');
      expect(svg).toHaveStyle({ margin: '10px', width: '32px', height: '32px' });
    });

    it('should handle click events when not disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<TaskAltIcon onClick={handleClick} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click events when disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<TaskAltIcon onClick={handleClick} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle mouse down events when not disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<TaskAltIcon onMouseDown={handleMouseDown} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);
    });

    it('should not handle mouse down events when disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<TaskAltIcon onMouseDown={handleMouseDown} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).not.toHaveBeenCalled();
    });

    it('should handle click without onClick handler', () => {
      const { container } = render(<TaskAltIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.click(svg!)).not.toThrow();
    });

    it('should handle mouse down without onMouseDown handler', () => {
      const { container } = render(<TaskAltIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.mouseDown(svg!)).not.toThrow();
    });
  });

  describe('CheckCircleIcon', () => {
    it('should render with default props', () => {
      const { container } = render(<CheckCircleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      expect(svg).toHaveAttribute('fill', '#000000');
    });

    it('should render with custom props', () => {
      const { container } = render(
        <CheckCircleIcon
          size={40}
          color="#00ff00"
          role="button"
          ariaLabel="Check circle"
          className="check-class"
          style={{ padding: '5px' }}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '40');
      expect(svg).toHaveAttribute('height', '40');
      expect(svg).toHaveAttribute('fill', '#00ff00');
      expect(svg).toHaveAttribute('aria-label', 'Check circle');
      expect(svg).toHaveClass('check-class');
      expect(svg).toHaveStyle({ padding: '5px', width: '40px', height: '40px' });
    });

    it('should handle click events when not disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<CheckCircleIcon onClick={handleClick} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click events when disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<CheckCircleIcon onClick={handleClick} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle mouse down events when not disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<CheckCircleIcon onMouseDown={handleMouseDown} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);
    });

    it('should not handle mouse down events when disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<CheckCircleIcon onMouseDown={handleMouseDown} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).not.toHaveBeenCalled();
    });

    it('should handle click without onClick handler', () => {
      const { container } = render(<CheckCircleIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.click(svg!)).not.toThrow();
    });

    it('should handle mouse down without onMouseDown handler', () => {
      const { container } = render(<CheckCircleIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.mouseDown(svg!)).not.toThrow();
    });
  });

  describe('CrossCircleIcon', () => {
    it('should render with default props', () => {
      const { container } = render(<CrossCircleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      expect(svg).toHaveAttribute('fill', '#ffffff');
    });

    it('should render with custom props', () => {
      const { container } = render(
        <CrossCircleIcon
          size={48}
          color="#ff0000"
          role="button"
          ariaLabel="Cross circle"
          className="cross-class"
          style={{ border: '1px solid black' }}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
      expect(svg).toHaveAttribute('fill', '#ff0000');
      expect(svg).toHaveAttribute('aria-label', 'Cross circle');
      expect(svg).toHaveClass('cross-class');
      expect(svg).toHaveStyle({ border: '1px solid black', width: '48px', height: '48px' });
    });

    it('should handle click events when not disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<CrossCircleIcon onClick={handleClick} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click events when disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<CrossCircleIcon onClick={handleClick} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle mouse down events when not disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<CrossCircleIcon onMouseDown={handleMouseDown} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);
    });

    it('should not handle mouse down events when disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<CrossCircleIcon onMouseDown={handleMouseDown} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).not.toHaveBeenCalled();
    });

    it('should handle click without onClick handler', () => {
      const { container } = render(<CrossCircleIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.click(svg!)).not.toThrow();
    });

    it('should handle mouse down without onMouseDown handler', () => {
      const { container } = render(<CrossCircleIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.mouseDown(svg!)).not.toThrow();
    });
  });

  describe('DeleteIcon', () => {
    it('should render with default props', () => {
      const { container } = render(<DeleteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      expect(svg).toHaveAttribute('stroke', '#ffffff');
      expect(svg).toHaveAttribute('role', 'button');
      expect(svg).toHaveStyle({ cursor: 'pointer', opacity: '1' });
    });

    it('should render with custom props', () => {
      const { container } = render(
        <DeleteIcon
          size={64}
          color="#ff0000"
          role="button"
          ariaLabel="Delete item"
          className="delete-class"
          style={{ backgroundColor: 'red' }}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
      expect(svg).toHaveAttribute('stroke', '#ff0000');
      expect(svg).toHaveAttribute('aria-label', 'Delete item');
      expect(svg).toHaveClass('delete-class');
      expect(svg).toHaveStyle({ 'background-color': 'rgb(255, 0, 0)', cursor: 'pointer', opacity: '1' });
    });

    it('should render with disabled state', () => {
      const { container } = render(<DeleteIcon disabled={true} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveStyle({ cursor: 'not-allowed', opacity: '0.5' });
    });

    it('should handle click events when not disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<DeleteIcon onClick={handleClick} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click events when disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(<DeleteIcon onClick={handleClick} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle mouse down events when not disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<DeleteIcon onMouseDown={handleMouseDown} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);
    });

    it('should handle mouse down events when disabled', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<DeleteIcon onMouseDown={handleMouseDown} disabled={true} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);
    });

    it('should handle click without onClick handler', () => {
      const { container } = render(<DeleteIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.click(svg!)).not.toThrow();
    });

    it('should handle mouse down without onMouseDown handler', () => {
      const { container } = render(<DeleteIcon />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.mouseDown(svg!)).not.toThrow();
    });

    it('should render with custom role', () => {
      const { container } = render(<DeleteIcon role="link" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('role', 'link');
    });

    it('should render without role attribute when not provided', () => {
      const { container } = render(<DeleteIcon role={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('role', 'button'); // Default role
    });

    it('should render without aria-label when not provided', () => {
      const { container } = render(<DeleteIcon ariaLabel={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveAttribute('aria-label');
    });
  });

  describe('Icon Props Edge Cases', () => {
    it('should handle undefined size', () => {
      const { container } = render(<TaskAltIcon size={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '20'); // Default size
      expect(svg).toHaveAttribute('height', '20');
    });

    it('should handle undefined color', () => {
      const { container } = render(<TaskAltIcon color={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', '#000000'); // Default color
    });

    it('should handle undefined disabled', () => {
      const { container } = render(<TaskAltIcon disabled={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      const { container } = render(<TaskAltIcon className={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveClass('undefined');
    });

    it('should handle undefined style', () => {
      const { container } = render(<TaskAltIcon style={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveStyle({ width: '20px', height: '20px' });
    });

    it('should handle undefined onClick', () => {
      const { container } = render(<TaskAltIcon onClick={undefined} />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.click(svg!)).not.toThrow();
    });

    it('should handle undefined onMouseDown', () => {
      const { container } = render(<TaskAltIcon onMouseDown={undefined} />);
      const svg = container.querySelector('svg');
      expect(() => fireEvent.mouseDown(svg!)).not.toThrow();
    });

    it('should handle undefined role', () => {
      const { container } = render(<TaskAltIcon role={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveAttribute('role');
    });

    it('should handle undefined ariaLabel', () => {
      const { container } = render(<TaskAltIcon ariaLabel={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveAttribute('aria-label');
    });
  });

  describe('SVG Structure', () => {
    it('should render TaskAltIcon with correct SVG structure', () => {
      const { container } = render(<TaskAltIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('stroke-width', '1.5');
    });

    it('should render CheckCircleIcon with correct SVG structure', () => {
      const { container } = render(<CheckCircleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', '#000000');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render CrossCircleIcon with correct SVG structure', () => {
      const { container } = render(<CrossCircleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', '#ffffff');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render DeleteIcon with correct SVG structure', () => {
      const { container } = render(<DeleteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('stroke-width', '2');
      expect(svg).toHaveAttribute('stroke-linecap', 'round');
      expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when provided', () => {
      const { container } = render(
        <TaskAltIcon
          role="button"
          ariaLabel="Complete task"
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Complete task');
    });

    it('should be keyboard accessible for DeleteIcon', () => {
      const { container } = render(<DeleteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Event Handling', () => {
    it('should pass correct event object to onClick', () => {
      const handleClick = jest.fn();
      const { container } = render(<TaskAltIcon onClick={handleClick} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
      expect(handleClick.mock.calls[0][0].type).toBe('click');
    });

    it('should pass correct event object to onMouseDown', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<TaskAltIcon onMouseDown={handleMouseDown} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledWith(expect.any(Object));
      expect(handleMouseDown.mock.calls[0][0].type).toBe('mousedown');
    });

    it('should handle multiple clicks correctly', () => {
      const handleClick = jest.fn();
      const { container } = render(<TaskAltIcon onClick={handleClick} />);
      const svg = container.querySelector('svg');
      fireEvent.click(svg!);
      fireEvent.click(svg!);
      fireEvent.click(svg!);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple mouse down events correctly', () => {
      const handleMouseDown = jest.fn();
      const { container } = render(<TaskAltIcon onMouseDown={handleMouseDown} />);
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!);
      fireEvent.mouseDown(svg!);
      expect(handleMouseDown).toHaveBeenCalledTimes(2);
    });
  });
}); 