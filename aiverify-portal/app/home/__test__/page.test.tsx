import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import HomePage from '../page';

// Mock the getProjects API call
jest.mock('@/lib/fetchApis/getProjects', () => ({
  getProjects: () => Promise.resolve({
    data: [
      {
        id: '1',
        name: 'Test Project 1',
        description: 'Test description 1',
      },
      {
        id: '2',
        name: 'Test Project 2',
        description: 'Test description 2',
      },
    ],
  }),
}));

// Mock child components
jest.mock('../components/projectCardsContainer', () => ({
  ProjectCardsContainer: ({ className }: { className?: string }) => (
    <div data-testid="project-cards-container" className={className}>
      Project Cards Container
    </div>
  ),
}));

jest.mock('../components/projectCardsLoading', () => ({
  ProjectCardsLoading: ({ className }: { className?: string }) => (
    <div data-testid="project-cards-loading" className={className}>
      Project Cards Loading
    </div>
  ),
}));

jest.mock('../components/userFlowCards', () => ({
  UserFlowCards: () => (
    <div data-testid="user-flow-cards">
      User Flow Cards
    </div>
  ),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main content wrapper with correct classes', async () => {
    render(await HomePage());
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('w-full', 'px-6');
  });

  it('renders welcome heading', async () => {
    render(await HomePage());
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome, what would you like to do today?');
    expect(heading).toHaveClass('my-6', 'text-2xl', 'font-bold', 'tracking-wide');
  });

  it('renders UserFlowCards component', async () => {
    render(await HomePage());
    
    expect(screen.getByTestId('user-flow-cards')).toBeInTheDocument();
  });

  it('renders ProjectCardsLoading as Suspense fallback', async () => {
    render(await HomePage());
    
    // During testing, the Suspense fallback (ProjectCardsLoading) is rendered
    const loadingComponent = screen.getByTestId('project-cards-loading');
    expect(loadingComponent).toBeInTheDocument();
    expect(loadingComponent).toHaveClass('flex', 'flex-wrap', 'gap-6');
  });

  it('has proper component hierarchy', async () => {
    render(await HomePage());
    
    // Check that components are rendered in correct order
    const main = screen.getByRole('main');
    const heading = screen.getByRole('heading', { level: 1 });
    const userFlowCards = screen.getByTestId('user-flow-cards');
    const loadingComponent = screen.getByTestId('project-cards-loading');
    
    expect(main).toContainElement(heading);
    expect(main).toContainElement(userFlowCards);
    expect(main).toContainElement(loadingComponent);
  });

  it('has correct semantic HTML structure', async () => {
    render(await HomePage());
    
    // Check main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Check heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('passes correct className prop to ProjectCardsLoading fallback', async () => {
    render(await HomePage());
    
    const loadingComponent = screen.getByTestId('project-cards-loading');
    expect(loadingComponent).toHaveClass('flex', 'flex-wrap', 'gap-6');
  });

  it('is marked as async server component', async () => {
    // Test that the component is async (this is implicit in the function signature)
    const result = HomePage();
    expect(result).toBeInstanceOf(Promise);
  });
}); 