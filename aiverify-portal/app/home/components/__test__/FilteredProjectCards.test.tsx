import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { FilteredProjectCards } from '../FilteredProjectCards';
import { ProjectSearchProvider } from '../ProjectSearchProvider';
import { Project } from '@/app/types';
import { useProjectSearch } from '../ProjectSearchProvider';
import { fireEvent } from '@testing-library/react';

// Mock project data
const mockProjects: Project[] = [
  {
    id: 1,
    globalVars: [],
    pages: [],
    templateId: 'template1',
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

// Mock the Card component
jest.mock('@/lib/components/card/card', () => ({
  Card: ({ children, size, width, className, ...props }: any) => (
    <div data-testid={`card-${props.key || 'card'}`} data-size={size} data-width={width} className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Card.Content as a property
Object.defineProperty(require('@/lib/components/card/card').Card, 'Content', {
  value: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
});

// Mock Card.SideBar as a property
Object.defineProperty(require('@/lib/components/card/card').Card, 'SideBar', {
  value: ({ children, className, ...props }: any) => (
    <div data-testid="card-sidebar" className={className} {...props}>
      {children}
    </div>
  ),
});

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock remixicon components
jest.mock('@remixicon/react', () => ({
  RiDeleteBinLine: ({ size, className }: any) => (
    <svg width={size} height={size} className={className} data-testid="delete-icon" />
  ),
  RiEyeLine: ({ size, className }: any) => (
    <svg width={size} height={size} className={className} data-testid="eye-icon" />
  ),
  RiPencilFill: ({ size, className }: any) => (
    <svg width={size} height={size} className={className} data-testid="pencil-icon" />
  ),
}));

describe('FilteredProjectCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ProjectCards with filtered projects from context', () => {
    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <FilteredProjectCards />
      </ProjectSearchProvider>
    );

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
  });

  it('renders empty result when no filtered projects', () => {
    render(
      <ProjectSearchProvider initialProjects={[]}>
        <FilteredProjectCards />
      </ProjectSearchProvider>
    );

    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
  });

  it('uses useProjectSearch hook correctly', () => {
    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <FilteredProjectCards />
      </ProjectSearchProvider>
    );

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
  });

  it('passes correct props to ProjectCards', () => {
    const testProjects = [
      {
        ...mockProjects[0],
        id: 2,
        projectInfo: { ...mockProjects[0].projectInfo, name: 'Test Project 2' },
      },
    ];

    render(
      <ProjectSearchProvider initialProjects={testProjects}>
        <FilteredProjectCards />
      </ProjectSearchProvider>
    );

    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('re-renders when filtered projects change', async () => {
    // Create a test component that can call onSearch to update filtered projects
    const TestSearchComponent = () => {
      const { onSearch } = useProjectSearch();
      
      return (
        <div>
          <FilteredProjectCards />
          <button onClick={() => onSearch([])}>Clear Projects</button>
        </div>
      );
    };

    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <TestSearchComponent />
      </ProjectSearchProvider>
    );

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();

    // Click the button to clear projects through onSearch
    const clearButton = screen.getByText('Clear Projects');
    fireEvent.click(clearButton);

    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
  });

  it('handles context updates correctly', () => {
    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <FilteredProjectCards />
      </ProjectSearchProvider>
    );

    // Verify the component renders with the context data
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
  });
}); 