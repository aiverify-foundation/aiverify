import React from 'react';
import { render, screen } from '@testing-library/react';
import { InfoIcon } from '../utils/icons';

describe('InfoIcon', () => {
  it('renders with default props', () => {
    const { container } = render(<InfoIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('fill', '#FFFFFF');
    expect(svg).toHaveAttribute('viewBox', '0 -6 396 396');
  });

  it('renders with custom size', () => {
    const { container } = render(<InfoIcon size={32} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    const { container } = render(<InfoIcon color="#FF0000" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('fill', '#FF0000');
  });

  it('renders with custom role', () => {
    render(<InfoIcon role="button" />);
    const svg = screen.getByRole('button', { hidden: true });
    
    expect(svg).toHaveAttribute('role', 'button');
  });

  it('renders with aria-label', () => {
    render(<InfoIcon ariaLabel="Information icon" />);
    const svg = screen.getByLabelText('Information icon');
    
    expect(svg).toHaveAttribute('aria-label', 'Information icon');
  });

  it('renders with custom className', () => {
    const { container } = render(<InfoIcon className="custom-icon-class" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('custom-icon-class');
  });

  it('renders with custom style', () => {
    const customStyle = { margin: '10px', padding: '5px' };
    const { container } = render(<InfoIcon style={customStyle} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveStyle('margin: 10px');
    expect(svg).toHaveStyle('padding: 5px');
  });

  it('renders when disabled is true', () => {
    const { container } = render(<InfoIcon disabled={true} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders when disabled is false', () => {
    const { container } = render(<InfoIcon disabled={false} />);
    const svg = container.querySelector('svg');
    
    expect(svg).not.toHaveAttribute('aria-disabled');
  });

  it('renders when disabled is undefined', () => {
    const { container } = render(<InfoIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).not.toHaveAttribute('aria-disabled');
  });

  it('renders with all props combined', () => {
    const customStyle = { border: '1px solid black' };
    render(
      <InfoIcon
        size={40}
        color="#00FF00"
        role="presentation"
        ariaLabel="Test info icon"
        disabled={true}
        className="test-class"
        style={customStyle}
      />
    );
    const svg = screen.getByLabelText('Test info icon');
    
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
    expect(svg).toHaveAttribute('fill', '#00FF00');
    expect(svg).toHaveAttribute('role', 'presentation');
    expect(svg).toHaveAttribute('aria-label', 'Test info icon');
    expect(svg).toHaveAttribute('aria-disabled', 'true');
    expect(svg).toHaveClass('test-class');
    expect(svg).toHaveStyle('border: 1px solid black');
  });

  it('renders with zero size', () => {
    const { container } = render(<InfoIcon size={0} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  it('renders with negative size', () => {
    const { container } = render(<InfoIcon size={-10} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '-10');
    expect(svg).toHaveAttribute('height', '-10');
  });

  it('renders with empty string color', () => {
    const { container } = render(<InfoIcon color="" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('fill', '');
  });

  it('renders with empty string ariaLabel', () => {
    const { container } = render(<InfoIcon ariaLabel="" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('aria-label', '');
  });

  it('renders with empty string className', () => {
    const { container } = render(<InfoIcon className="" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('class', '');
  });

  it('renders with empty style object', () => {
    const { container } = render(<InfoIcon style={{}} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null style', () => {
    const { container } = render(<InfoIcon style={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined style', () => {
    const { container } = render(<InfoIcon style={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null role', () => {
    const { container } = render(<InfoIcon role={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined role', () => {
    const { container } = render(<InfoIcon role={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null ariaLabel', () => {
    const { container } = render(<InfoIcon ariaLabel={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined ariaLabel', () => {
    const { container } = render(<InfoIcon ariaLabel={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null className', () => {
    const { container } = render(<InfoIcon className={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined className', () => {
    const { container } = render(<InfoIcon className={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null color', () => {
    const { container } = render(<InfoIcon color={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined color', () => {
    const { container } = render(<InfoIcon color={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null size', () => {
    const { container } = render(<InfoIcon size={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined size', () => {
    const { container } = render(<InfoIcon size={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null disabled', () => {
    const { container } = render(<InfoIcon disabled={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined disabled', () => {
    const { container } = render(<InfoIcon disabled={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders SVG path element correctly', () => {
    const { container } = render(<InfoIcon />);
    const svg = container.querySelector('svg');
    const path = svg?.querySelector('path');
    
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M198 342q-40.5 0 -75 -20.25t-54.75 -54.75 -20.25 -75 20.25 -75 54.75 -54.75 75 -20.25 75 20.25 54.75 54.75 20.25 75 -20.25 75 -54.75 54.75 -75 20.25m24 -186v-48h-48v48zm0 120V180h-48v96z');
  });

  it('renders title element correctly', () => {
    const { container } = render(<InfoIcon />);
    const svg = container.querySelector('svg');
    const title = svg?.querySelector('title');
    
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('info');
  });

  it('renders with correct xmlns attribute', () => {
    const { container } = render(<InfoIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  it('renders with correct viewBox attribute', () => {
    const { container } = render(<InfoIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('viewBox', '0 -6 396 396');
  });

  it('handles boolean disabled prop correctly', () => {
    const { container, rerender } = render(<InfoIcon disabled={true} />);
    let svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-disabled', 'true');

    rerender(<InfoIcon disabled={false} />);
    svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('aria-disabled');
  });

  it('handles string disabled prop correctly', () => {
    const { container } = render(<InfoIcon disabled={'true' as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('aria-disabled', 'true');
  });

  it('handles number disabled prop correctly', () => {
    const { container } = render(<InfoIcon disabled={1 as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('aria-disabled', 'true');
  });

  it('handles zero disabled prop correctly', () => {
    const { container } = render(<InfoIcon disabled={0 as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).not.toHaveAttribute('aria-disabled');
  });
}); 