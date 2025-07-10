import { render, screen } from '@testing-library/react';
import React from 'react';
import { UserFlowCards } from '../userFlowCards';

describe('UserFlowCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main section with correct attributes', () => {
    render(<UserFlowCards />);

    const section = screen.getByTestId('user-flow-cards');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('flex', 'w-full', 'justify-start');
    expect(section.tagName).toBe('SECTION');
    
    const gridContainer = section.firstElementChild;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-4', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
  });

  it('renders two navigation links', () => {
    render(<UserFlowCards />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    
    expect(links[0]).toHaveAttribute('href', '/project/new');
    expect(links[1]).toHaveAttribute('href', '/home/manage');
  });

  it('displays correct card content', () => {
    render(<UserFlowCards />);

    // Check first card content
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByText('Test an AI Model and generate reports')).toBeInTheDocument();
    
    // Check second card content
    expect(screen.getByText('Manage')).toBeInTheDocument();
    expect(screen.getByText('Manage Models, Datasets, etc')).toBeInTheDocument();
  });

  it('renders cards with correct CSS classes', () => {
    const { container } = render(<UserFlowCards />);

    const cards = container.querySelectorAll('.card');
    
    expect(cards).toHaveLength(2);
    cards.forEach(card => {
      expect(card).toHaveClass('card', 'bg-secondary-500', '!bg-none');
    });
    
    // Check specific card sizes
    expect(cards[0]).toHaveClass('card_sm');
    expect(cards[1]).toHaveClass('card_md');
  });

  it('renders icon for the first card', () => {
    const { container } = render(<UserFlowCards />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
    
    // Check first icon (Create New Project card)
    const firstIcon = icons[0];
    expect(firstIcon).toHaveAttribute('width', '50');
    expect(firstIcon).toHaveAttribute('height', '50');
    expect(firstIcon).toHaveAttribute('fill', 'white');
  });

  it('has proper semantic structure', () => {
    render(<UserFlowCards />);

    const section = screen.getByTestId('user-flow-cards');
    expect(section).toBeInTheDocument();
    expect(section.tagName).toBe('SECTION');
    
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(2);
    
    headings.forEach(heading => {
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'tracking-wide', 'text-shadow-sm');
    });
  });

  it('has accessible link structure', () => {
    render(<UserFlowCards />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    
    links.forEach(link => {
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href');
    });
  });

  it('renders consistent card dimensions', () => {
    const { container } = render(<UserFlowCards />);

    const cards = container.querySelectorAll('.card');
    
    cards.forEach(card => {
      // Check that cards have consistent styling
      expect(card).toHaveClass('bg-secondary-500', '!bg-none');
      expect(card).toHaveStyle('width: 320px');
      expect(card).toHaveStyle('height: 192px'); // 320 * 0.6 = 192
    });
  });
}); 