import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ManagePage from '../page';

describe('ManagePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main content wrapper with correct classes', () => {
    render(<ManagePage />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('w-full', 'px-6');
  });

  it('renders the main heading', () => {
    render(<ManagePage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Manage Models and Resources');
    expect(heading).toHaveClass('my-6', 'text-2xl', 'font-bold', 'tracking-wide');
  });

  it('renders UserManageFlowCards component', () => {
    render(<ManagePage />);
    
    // Check for the UserManageFlowCards section by its CSS classes
    const section = document.querySelector('section.flex.w-full.justify-center');
    expect(section).toBeInTheDocument();
    
    // Check that navigation cards are rendered
    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('has proper component hierarchy', () => {
    render(<ManagePage />);

    const main = screen.getByRole('main');
    const heading = screen.getByRole('heading', { level: 1 });
    const section = document.querySelector('section');

    expect(main).toContainElement(heading);
    expect(main).toContainElement(section);
  });

  it('renders navigation cards for management functions', () => {
    render(<ManagePage />);

    // Check for specific management options
    expect(screen.getByRole('link', { name: /models/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /data/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /report templates/i })).toBeInTheDocument();
  });

  it('has accessible structure', () => {
    render(<ManagePage />);

    // Main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Heading structure
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();

    // Navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('renders cards with proper styling', () => {
    render(<ManagePage />);

    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
    
    cards.forEach(card => {
      expect(card).toHaveClass('card');
      expect(card).toHaveClass('card_md');
    });
  });

  it('contains the expected number of management options', () => {
    render(<ManagePage />);

    // Should have 6 management cards (Models, Data, Templates, Inputs, Plugins, Results)
    const cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(6);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
  });

  it('renders with semantic HTML', () => {
    render(<ManagePage />);

    // Check for semantic elements
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(document.querySelector('section')).toBeInTheDocument();
  });
}); 