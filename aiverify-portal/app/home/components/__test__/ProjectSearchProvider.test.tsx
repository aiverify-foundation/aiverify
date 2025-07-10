import { jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Project } from '@/app/types';
import { ProjectSearchProvider, useProjectSearch } from '../ProjectSearchProvider';

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
  {
    id: 2,
    globalVars: [],
    pages: [],
    templateId: 'template2',
    projectInfo: {
      name: 'Test Project 2',
      description: 'Test Description 2',
      reportTitle: 'Test Report 2',
      company: 'Test Company',
    },
    testModelId: 2,
    inputBlocks: [],
    testResults: [],
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

// Test component that uses the hook
const TestComponent = () => {
  const { filteredProjects, onSearch } = useProjectSearch();

  return (
    <div>
      <div data-testid="projects-count">{filteredProjects.length}</div>
      <div data-testid="projects-list">
        {filteredProjects.map((project) => (
          <div key={project.id} data-testid={`project-${project.id}`}>
            {project.projectInfo.name}
          </div>
        ))}
      </div>
      <button
        data-testid="search-button"
        onClick={() => onSearch(mockProjects.slice(0, 1))}
      >
        Filter Projects
      </button>
    </div>
  );
};

describe('ProjectSearchProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial projects to context', () => {
    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <TestComponent />
      </ProjectSearchProvider>
    );

    expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
    expect(screen.getByTestId('project-1')).toHaveTextContent('Test Project 1');
    expect(screen.getByTestId('project-2')).toHaveTextContent('Test Project 2');
  });

  it('updates filtered projects when onSearch is called', () => {
    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <TestComponent />
      </ProjectSearchProvider>
    );

    // Initially shows all projects
    expect(screen.getByTestId('projects-count')).toHaveTextContent('2');

    // Filter projects
    fireEvent.click(screen.getByTestId('search-button'));

    // Should now show only 1 project
    expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
    expect(screen.getByTestId('project-1')).toHaveTextContent('Test Project 1');
    expect(screen.queryByTestId('project-2')).not.toBeInTheDocument();
  });

  it('handles empty initial projects', () => {
    render(
      <ProjectSearchProvider initialProjects={[]}>
        <TestComponent />
      </ProjectSearchProvider>
    );

    expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
  });

  it('handles empty search results', () => {
    const TestComponentEmptySearch = () => {
      const { filteredProjects, onSearch } = useProjectSearch();

      return (
        <div>
          <div data-testid="projects-count">{filteredProjects.length}</div>
          <button
            data-testid="empty-search-button"
            onClick={() => onSearch([])}
          >
            Clear All
          </button>
        </div>
      );
    };

    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <TestComponentEmptySearch />
      </ProjectSearchProvider>
    );

    expect(screen.getByTestId('projects-count')).toHaveTextContent('2');

    fireEvent.click(screen.getByTestId('empty-search-button'));

    expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
  });

  it('re-renders child components when filtered projects change', () => {
    const TestComponentWithCounter = () => {
      const { filteredProjects, onSearch } = useProjectSearch();
      const [renderCount, setRenderCount] = React.useState(0);

      React.useEffect(() => {
        setRenderCount(prev => prev + 1);
      }, [filteredProjects]);

      return (
        <div>
          <div data-testid="render-count">{renderCount}</div>
          <button
            data-testid="trigger-search"
            onClick={() => onSearch(mockProjects.slice(0, 1))}
          >
            Search
          </button>
        </div>
      );
    };

    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <TestComponentWithCounter />
      </ProjectSearchProvider>
    );

    // Initial render
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');

    // Trigger search
    fireEvent.click(screen.getByTestId('trigger-search'));

    // Should re-render
    expect(screen.getByTestId('render-count')).toHaveTextContent('2');
  });

  it('maintains separate state for multiple provider instances', () => {
    const TestComponentProvider1 = () => {
      const { filteredProjects } = useProjectSearch();
      return <div data-testid="provider1-count">{filteredProjects.length}</div>;
    };

    const TestComponentProvider2 = () => {
      const { filteredProjects } = useProjectSearch();
      return <div data-testid="provider2-count">{filteredProjects.length}</div>;
    };

    render(
      <div>
        <ProjectSearchProvider initialProjects={mockProjects}>
          <TestComponentProvider1 />
        </ProjectSearchProvider>
        <ProjectSearchProvider initialProjects={[mockProjects[0]]}>
          <TestComponentProvider2 />
        </ProjectSearchProvider>
      </div>
    );

    expect(screen.getByTestId('provider1-count')).toHaveTextContent('2');
    expect(screen.getByTestId('provider2-count')).toHaveTextContent('1');
  });
});

describe('useProjectSearch', () => {
  it('throws error when used outside of ProjectSearchProvider', () => {
    const TestComponentWithoutProvider = () => {
      useProjectSearch();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useProjectSearch must be used within a ProjectSearchProvider');

    console.error = originalError;
  });

  it('provides correct context value structure', () => {
    const TestComponentContextValue = () => {
      const context = useProjectSearch();
      
      return (
        <div>
          <div data-testid="has-filtered-projects">
            {Array.isArray(context.filteredProjects) ? 'true' : 'false'}
          </div>
          <div data-testid="has-on-search">
            {typeof context.onSearch === 'function' ? 'true' : 'false'}
          </div>
        </div>
      );
    };

    render(
      <ProjectSearchProvider initialProjects={mockProjects}>
        <TestComponentContextValue />
      </ProjectSearchProvider>
    );

    expect(screen.getByTestId('has-filtered-projects')).toHaveTextContent('true');
    expect(screen.getByTestId('has-on-search')).toHaveTextContent('true');
  });
}); 