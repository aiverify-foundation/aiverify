import React from 'react';
import { render, screen } from '@testing-library/react';
import { UploadIcon } from '../icons';

describe('UploadIcon', () => {
  it('renders with default props', () => {
    const { container } = render(<UploadIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '50');
    expect(svg).toHaveAttribute('height', '50');
    expect(svg).toHaveAttribute('fill', '#FFFFFF');
    expect(svg).toHaveAttribute('viewBox', '-3.75 -3.75 18 18');
  });

  it('renders with custom size', () => {
    const { container } = render(<UploadIcon size={32} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    const { container } = render(<UploadIcon color="#FF0000" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('fill', '#FF0000');
  });

  it('renders with zero size', () => {
    const { container } = render(<UploadIcon size={0} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  it('renders with negative size', () => {
    const { container } = render(<UploadIcon size={-10} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '-10');
    expect(svg).toHaveAttribute('height', '-10');
  });

  it('renders with empty string color', () => {
    const { container } = render(<UploadIcon color="" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('fill', '');
  });

  it('renders with null color', () => {
    const { container } = render(<UploadIcon color={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined color', () => {
    const { container } = render(<UploadIcon color={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with null size', () => {
    const { container } = render(<UploadIcon size={null as any} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined size', () => {
    const { container } = render(<UploadIcon size={undefined} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('renders SVG path element correctly', () => {
    const { container } = render(<UploadIcon />);
    const svg = container.querySelector('svg');
    const path = svg?.querySelector('path');
    
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M6 2.561v4.232a0.75 0.75 0 1 1 -1.5 0V2.561L3.659 3.402A0.75 0.75 0 0 1 2.598 2.34L4.72 0.22a0.75 0.75 0 0 1 1.06 0l2.122 2.121A0.75 0.75 0 1 1 6.84 3.402zM0.75 9h9a0.75 0.75 0 0 1 0 1.5H0.75a0.75 0.75 0 0 1 0 -1.5');
  });

  it('renders with correct xmlns attribute', () => {
    const { container } = render(<UploadIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  it('renders with correct viewBox attribute', () => {
    const { container } = render(<UploadIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('viewBox', '-3.75 -3.75 18 18');
  });

  it('uses default size when size is not provided', () => {
    const { container } = render(<UploadIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '50');
    expect(svg).toHaveAttribute('height', '50');
  });

  it('uses default color when color is not provided', () => {
    const { container } = render(<UploadIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('fill', '#FFFFFF');
  });

  it('overrides default size with custom size', () => {
    const { container } = render(<UploadIcon size={100} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '100');
  });

  it('overrides default color with custom color', () => {
    const { container } = render(<UploadIcon color="#000000" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('fill', '#000000');
  });

  it('renders with both custom size and color', () => {
    const { container } = render(<UploadIcon size={75} color="#FF00FF" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '75');
    expect(svg).toHaveAttribute('height', '75');
    expect(svg).toHaveAttribute('fill', '#FF00FF');
  });

  it('ignores unused props gracefully', () => {
    const { container } = render(
      <UploadIcon
        size={60}
        color="#123456"
        role="button"
        ariaLabel="Test icon"
        disabled={true}
        className="test-class"
        style={{ margin: '10px' }}
      />
    );
    const svg = container.querySelector('svg');
    
    // Should only use size and color
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
    expect(svg).toHaveAttribute('fill', '#123456');
    
    // Should not have other attributes
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-label');
    expect(svg).not.toHaveAttribute('aria-disabled');
    expect(svg).not.toHaveAttribute('class');
    expect(svg).not.toHaveStyle('margin: 10px');
  });
}); 