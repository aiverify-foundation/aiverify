import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple mock data structure
const mockProjectsData = [
  {
    id: 1,
    templateId: 'template1',
    pages: [{ layouts: [], reportWidgets: [] }],
    globalVars: [],
    projectInfo: {
      name: 'Test Project 1',
      description: 'Test Description 1',
      reportTitle: 'Test Report 1',
      company: 'Test Company',
    },
    testModelId: 1,
    inputBlocks: [],
    testResults: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

// Mock the getProjects API function simply
jest.mock('@/lib/fetchApis/getProjects', () => ({
  getProjects: jest.fn(() => Promise.resolve({
    status: 'success',
    code: 200,
    data: mockProjectsData
  })),
}));

// Mock child components - focus on structure testing
jest.mock('../ProjectSearchProvider', () => ({
  ProjectSearchProvider: ({ children, initialProjects }: any) => (
    <div data-testid="project-search-provider" data-projects-count={initialProjects?.length || 0}>
      {children}
    </div>
  ),
}));

jest.mock('../projectFilters', () => ({
  ProjectsFilters: ({ projects, className }: any) => (
    <div data-testid="projects-filters" className={className}>
      Projects Filters
    </div>
  ),
}));

jest.mock('../FilteredProjectCards', () => ({
  FilteredProjectCards: () => (
    <div data-testid="filtered-project-cards">
      Filtered Project Cards
    </div>
  ),
}));

describe('ProjectCardsContainer', () => {
  // Import the component dynamically after mocks are set up
  let ProjectCardsContainer: any;
  
  beforeAll(async () => {
    // Dynamic import after mocks are established
    const moduleImport = await import('../projectCardsContainer');
    ProjectCardsContainer = moduleImport.ProjectCardsContainer;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders successfully with projects data', async () => {
    // Render the async server component
    const component = await ProjectCardsContainer({ className: 'test-class' });
    render(component);

    // Test what actually gets rendered
    expect(screen.getByTestId('project-search-provider')).toBeInTheDocument();
    expect(screen.getByTestId('projects-filters')).toBeInTheDocument();
    expect(screen.getByTestId('filtered-project-cards')).toBeInTheDocument();
  });

  it('applies custom className to section', async () => {
    const component = await ProjectCardsContainer({ className: 'custom-class' });
    render(component);

    const section = screen.getByTestId('project-cards-container');
    expect(section).toHaveClass('custom-class');
  });

  it('renders with correct component structure', async () => {
    const component = await ProjectCardsContainer({ className: 'test-class' });
    render(component);

    // Test the component hierarchy
    const provider = screen.getByTestId('project-search-provider');
    const filters = screen.getByTestId('projects-filters');
    const section = screen.getByTestId('project-cards-container');

    expect(provider).toContainElement(filters);
    expect(provider).toContainElement(section);
  });

  it('renders projects filters with correct styling', async () => {
    const component = await ProjectCardsContainer({ className: 'test-class' });
    render(component);

    const filters = screen.getByTestId('projects-filters');
    expect(filters).toHaveClass('my-6', 'mt-[100px]');
  });

  it('renders filtered project cards section', async () => {
    const component = await ProjectCardsContainer({ className: 'test-class' });
    render(component);

    const section = screen.getByTestId('project-cards-container');
    const filteredCards = screen.getByTestId('filtered-project-cards');
    
    expect(section).toContainElement(filteredCards);
  });

  it('passes projects data to search provider', async () => {
    const component = await ProjectCardsContainer({ className: 'test-class' });
    render(component);

    const provider = screen.getByTestId('project-search-provider');
    expect(provider).toHaveAttribute('data-projects-count', '1');
  });

  // Test error scenario with simpler approach
  it('handles API errors gracefully', async () => {
    // Import and mock for this specific test
    const { getProjects } = await import('@/lib/fetchApis/getProjects');
    (getProjects as any).mockImplementationOnce(() => 
      Promise.resolve({ message: 'API Error' })
    );

    // This should throw an error which is the expected behavior
    await expect(ProjectCardsContainer({ className: 'test-class' })).rejects.toThrow('API Error');
  });
}); 