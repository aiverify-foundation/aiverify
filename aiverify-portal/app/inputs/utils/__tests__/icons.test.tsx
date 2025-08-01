import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScaleIcon, ChevronLeftIcon } from '../icons';

describe('ScaleIcon', () => {
  it('renders with default props', () => {
    render(<ScaleIcon />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
    expect(svg).toHaveAttribute('stroke', '#000000');
  });

  it('renders with custom color', () => {
    render(<ScaleIcon color="#FF0000" />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('stroke', '#FF0000');
  });

  it('renders with custom className', () => {
    render(<ScaleIcon className="custom-class" />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveClass('custom-class');
  });

  it('renders with custom role', () => {
    render(<ScaleIcon role="button" />);
    
    const svg = screen.getByRole('button', { hidden: true });
    expect(svg).toBeInTheDocument();
  });

  it('renders with aria-label for accessibility', () => {
    render(<ScaleIcon ariaLabel="Scale icon" />);
    
    const svg = screen.getByLabelText('Scale icon');
    expect(svg).toBeInTheDocument();
  });

  it('renders with custom style', () => {
    const customStyle = { margin: '10px' };
    render(<ScaleIcon style={customStyle} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveStyle('margin: 10px');
  });

  it('renders with correct SVG attributes', () => {
    render(<ScaleIcon />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('stroke-width', '0.3');
  });

  it('renders with correct path element', () => {
    render(<ScaleIcon />);
    
    const path = screen.getByRole('img', { hidden: true }).querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('fill', '#000000');
  });

  it('renders with custom color applied to path', () => {
    render(<ScaleIcon color="#00FF00" />);
    
    const path = screen.getByRole('img', { hidden: true }).querySelector('path');
    expect(path).toHaveAttribute('fill', '#00FF00');
  });

  it('handles disabled state', () => {
    render(<ScaleIcon disabled={true} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
  });
});

describe('ChevronLeftIcon', () => {
  it('renders with default props', () => {
    render(<ChevronLeftIcon />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('fill', '#FFFFFF');
  });

  it('renders with custom size', () => {
    render(<ChevronLeftIcon size={32} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<ChevronLeftIcon color="#000000" />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('fill', '#000000');
  });

  it('renders with custom className', () => {
    render(<ChevronLeftIcon className="custom-class" />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveClass('custom-class');
  });

  it('renders with custom role', () => {
    render(<ChevronLeftIcon role="button" />);
    
    const svg = screen.getByRole('button', { hidden: true });
    expect(svg).toBeInTheDocument();
  });

  it('renders with aria-label for accessibility', () => {
    render(<ChevronLeftIcon ariaLabel="Chevron left icon" />);
    
    const svg = screen.getByLabelText('Chevron left icon');
    expect(svg).toBeInTheDocument();
  });

  it('renders with custom style', () => {
    const customStyle = { margin: '10px' };
    render(<ChevronLeftIcon style={customStyle} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveStyle('margin: 10px');
  });

  it('renders with correct SVG attributes', () => {
    render(<ChevronLeftIcon />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders with correct path element', () => {
    render(<ChevronLeftIcon />);
    
    const path = screen.getByRole('img', { hidden: true }).querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('fill-rule', 'evenodd');
  });

  it('renders with custom color applied to path', () => {
    render(<ChevronLeftIcon color="#00FF00" />);
    
    const path = screen.getByRole('img', { hidden: true }).querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<ChevronLeftIcon disabled={true} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
  });

  it('renders with zero size', () => {
    render(<ChevronLeftIcon size={0} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  it('renders with large size', () => {
    render(<ChevronLeftIcon size={100} />);
    
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '100');
  });
});

describe('Icon Accessibility', () => {
  it('ScaleIcon supports screen readers with aria-label', () => {
    render(<ScaleIcon ariaLabel="Scale icon for measurements" />);
    
    const svg = screen.getByLabelText('Scale icon for measurements');
    expect(svg).toBeInTheDocument();
  });

  it('ChevronLeftIcon supports screen readers with aria-label', () => {
    render(<ChevronLeftIcon ariaLabel="Navigate to previous page" />);
    
    const svg = screen.getByLabelText('Navigate to previous page');
    expect(svg).toBeInTheDocument();
  });

  it('ScaleIcon can be used as a button', () => {
    render(<ScaleIcon role="button" ariaLabel="Click to measure" />);
    
    const button = screen.getByRole('button', { name: 'Click to measure' });
    expect(button).toBeInTheDocument();
  });

  it('ChevronLeftIcon can be used as a button', () => {
    render(<ChevronLeftIcon role="button" ariaLabel="Go back" />);
    
    const button = screen.getByRole('button', { name: 'Go back' });
    expect(button).toBeInTheDocument();
  });
}); 