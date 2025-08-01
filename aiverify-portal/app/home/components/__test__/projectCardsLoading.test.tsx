import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProjectCardsLoading } from '../projectCardsLoading';

describe('ProjectCardsLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton cards', () => {
    render(<ProjectCardsLoading />);

    const cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(3);
  });

  it('renders skeleton elements inside each card', () => {
    render(<ProjectCardsLoading />);

    const cardContents = document.querySelectorAll('.cardContent');
    expect(cardContents).toHaveLength(3);

    // Check for skeleton elements (animated divs)
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements).toHaveLength(6); // 2 skeleton elements per card, 3 cards
  });

  it('applies correct card properties', () => {
    render(<ProjectCardsLoading />);

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      expect(card).toHaveClass('card', 'card_md', 'text-shadow-sm', '!bg-none', 'text-white', '[&&]:bg-secondary-900');
      expect(card).toHaveStyle('width: 450px');
    });
  });

  it('applies correct styling to card content', () => {
    render(<ProjectCardsLoading />);

    const cardContents = document.querySelectorAll('.cardContent');
    cardContents.forEach(content => {
      expect(content).toHaveClass('flex', 'flex-col', 'gap-7', 'p-4');
    });
  });

  it('applies custom className to section', () => {
    render(<ProjectCardsLoading className="custom-loading-class" />);

    const section = screen.getByTestId('project-cards-loading');
    expect(section).toHaveClass('custom-loading-class');
  });

  it('renders without className prop', () => {
    render(<ProjectCardsLoading />);

    const section = screen.getByTestId('project-cards-loading');
    expect(section).toBeInTheDocument();
  });

  it('has correct skeleton element styling for title', () => {
    render(<ProjectCardsLoading />);

    const titleSkeletons = document.querySelectorAll('.h-7.w-48.animate-pulse');
    expect(titleSkeletons).toHaveLength(3);

    titleSkeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('h-7', 'w-48', 'animate-pulse', 'rounded-md', 'bg-secondary-600');
    });
  });

  it('has correct skeleton element styling for description', () => {
    render(<ProjectCardsLoading />);

    const descriptionSkeletons = document.querySelectorAll('.h-20.w-full.animate-pulse');
    expect(descriptionSkeletons).toHaveLength(3);

    descriptionSkeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('h-20', 'w-full', 'animate-pulse', 'rounded-md', 'bg-secondary-600');
    });
  });

  it('renders consistent structure for all loading cards', () => {
    render(<ProjectCardsLoading />);

    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      const cardContent = card.querySelector('.cardContent');
      expect(cardContent).toBeInTheDocument();
      
      const skeletonElements = cardContent!.querySelectorAll('.animate-pulse');
      expect(skeletonElements).toHaveLength(2); // Title and description skeleton
    });
  });

  it('wraps cards in a section element', () => {
    render(<ProjectCardsLoading />);

    const section = screen.getByTestId('project-cards-loading');
    expect(section.tagName).toBe('SECTION');
  });

  it('maintains proper semantic structure', () => {
    render(<ProjectCardsLoading />);

    const section = screen.getByTestId('project-cards-loading');
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      expect(section).toContainElement(card as HTMLElement);
    });
  });

  it('renders same loading pattern for all cards', () => {
    render(<ProjectCardsLoading />);

    const cards = document.querySelectorAll('.card');
    
    // All cards should have the same structure
    cards.forEach(card => {
      const cardContent = card.querySelector('.cardContent');
      const skeletonElements = cardContent!.children;
      
      expect(skeletonElements).toHaveLength(2);
      expect(skeletonElements[0]).toHaveClass('h-7', 'w-48');
      expect(skeletonElements[1]).toHaveClass('h-20', 'w-full');
    });
  });

  it('applies correct gap styling to card content', () => {
    render(<ProjectCardsLoading />);

    const cardContents = document.querySelectorAll('.cardContent');
    cardContents.forEach(content => {
      expect(content).toHaveClass('gap-7');
    });
  });

  it('handles undefined className prop gracefully', () => {
    render(<ProjectCardsLoading className={undefined} />);

    const section = screen.getByTestId('project-cards-loading');
    expect(section).toBeInTheDocument();
  });
}); 