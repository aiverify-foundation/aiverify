import { render, screen } from '@testing-library/react';
import React from 'react';
import { UserManageFlowCards } from '../userManageFlowCards';

describe('UserManageFlowCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main section with correct classes', () => {
    render(<UserManageFlowCards />);

    // Use a more specific selector - look for the section with the specific class structure
    const section = document.querySelector('section.flex.w-full.justify-center');
    expect(section).toBeInTheDocument();
    expect(section?.tagName).toBe('SECTION');
    
    const gridContainer = section?.firstElementChild;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-4', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
  });

  it('renders six navigation cards', () => {
    render(<UserManageFlowCards />);

    // Count the number of cards by their CSS class
    const cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(6);
  });

  it('renders correct navigation links', () => {
    render(<UserManageFlowCards />);

    // Check for specific navigation links
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);

    // Check that specific navigation paths exist
    const modelLink = screen.getByRole('link', { name: /models/i });
    const dataLink = screen.getByRole('link', { name: /data/i });
    const templatesLink = screen.getByRole('link', { name: /report templates/i });
    
    expect(modelLink).toHaveAttribute('href', '/models');
    expect(dataLink).toHaveAttribute('href', '/datasets');
    expect(templatesLink).toHaveAttribute('href', '/templates');
  });

  it('renders card titles as h2 elements', () => {
    render(<UserManageFlowCards />);

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(6);
    
    // Check for specific titles
    expect(screen.getByRole('heading', { level: 2, name: 'Models' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Report Templates' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'User Inputs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Plugins' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Test Results' })).toBeInTheDocument();
  });

  it('renders descriptive text for each card', () => {
    render(<UserManageFlowCards />);

    expect(screen.getByText('Manage Models')).toBeInTheDocument();
    expect(screen.getByText('Manage datasets')).toBeInTheDocument();
    expect(screen.getByText('Manage report templates')).toBeInTheDocument();
    expect(screen.getByText('Manage user inputs')).toBeInTheDocument();
    expect(screen.getByText('Manage plugins')).toBeInTheDocument();
    expect(screen.getByText('Manage test results')).toBeInTheDocument();
  });

  it('renders SVG icons for each card', () => {
    render(<UserManageFlowCards />);

    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(6);
    
    // Each icon should have proper dimensions
    svgIcons.forEach(icon => {
      expect(icon).toHaveAttribute('width', '50');
      expect(icon).toHaveAttribute('height', '50');
    });
  });

  it('applies correct card styling', () => {
    render(<UserManageFlowCards />);

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      expect(card).toHaveClass('card', 'card_md', 'bg-secondary-500', '!bg-none');
      expect(card).toHaveStyle('height: 192px');
      expect(card).toHaveStyle('width: 320px');
    });
  });

  it('renders cards with gradient background', () => {
    render(<UserManageFlowCards />);

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      expect(card).toHaveStyle('background-image: linear-gradient(to bottom, var(--color-primary-900), var(--color-primary-700))');
    });
  });

  it('has proper icon containers', () => {
    render(<UserManageFlowCards />);

    const iconWrappers = document.querySelectorAll('.icon_wrapper');
    expect(iconWrappers).toHaveLength(6);
    
    iconWrappers.forEach(wrapper => {
      expect(wrapper).toHaveStyle('width: 50px');
      expect(wrapper).toHaveStyle('height: 50px');
    });
  });

  it('uses semantic HTML structure', () => {
    render(<UserManageFlowCards />);

    // Section wrapper
    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
    
    // All cards should be wrapped in links
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
    
    // All cards should have proper heading structure
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(6);
  });

  it('has accessible link structure', () => {
    render(<UserManageFlowCards />);

    const links = screen.getAllByRole('link');
    
    // Each link should have a proper href
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      const href = link.getAttribute('href');
      expect(href).toMatch(/^\/[a-z]+$/); // Should be a simple path like /models, /datasets, etc.
    });
  });

  it('renders consistent layout for all cards', () => {
    render(<UserManageFlowCards />);

    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      // Each card should have flexbox structure
      const flexbox = card.querySelector('.cardFlexbox');
      expect(flexbox).toBeInTheDocument();
      
      // Each card should have content area
      const content = card.querySelector('.cardContent');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('flex', 'flex-col', 'justify-between', 'p-6');
      
      // Each card should have an icon wrapper
      const iconWrapper = card.querySelector('.icon_wrapper');
      expect(iconWrapper).toBeInTheDocument();
    });
  });
}); 