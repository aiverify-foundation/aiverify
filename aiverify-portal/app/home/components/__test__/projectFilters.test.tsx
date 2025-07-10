import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Project } from '@/app/types';
import { ProjectSearchProvider } from '../ProjectSearchProvider';
import { ProjectsFilters } from '../projectFilters';

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
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

// Wrapper component with ProjectSearchProvider
const TestWrapper: React.FC<{ children: React.ReactNode; initialProjects?: Project[] }> = ({ 
  children, 
  initialProjects = mockProjects 
}) => (
  <ProjectSearchProvider initialProjects={initialProjects}>
    {children}
  </ProjectSearchProvider>
);

describe('ProjectsFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct structure and elements', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('flex', 'flex-col', 'gap-6');

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('My Projects');
    expect(heading).toHaveClass('text-xl', 'font-bold', 'tracking-wide');
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} className="custom-class" />
      </TestWrapper>
    );

    const section = document.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('renders search input with correct placeholder', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search projects...');
  });

  it('renders search input with correct styles', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toHaveStyle({ paddingLeft: '40px' });
  });

  it('renders magnify glass icon with correct properties', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    // Look for the icon container with absolute positioning
    const iconContainer = document.querySelector('[style*="position: absolute"]');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveStyle({
      position: 'absolute',
      top: '8px',
      left: '8px',
    });
  });

  it('renders clear button with correct properties', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeInTheDocument();
    expect(clearButton.tagName).toBe('BUTTON');
    expect(clearButton).toHaveClass('btn', 'btn_secondary', 'btn_sm', 'flat');
  });

  it('handles search input change', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    fireEvent.change(searchInput, { target: { value: 'Test Project 1' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Test Project 1');
    });
  });

  it('handles empty search query', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    fireEvent.change(searchInput, { target: { value: '' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('handles whitespace-only search query', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    fireEvent.change(searchInput, { target: { value: '   ' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('   ');
    });
  });

  it('handles clear button click', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    const clearButton = screen.getByText('Clear');
    
    // First, enter some text
    fireEvent.change(searchInput, { target: { value: 'Test Project 1' } });
    
    // Then click clear button
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('updates search query state correctly', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    // Test multiple search queries
    fireEvent.change(searchInput, { target: { value: 'Project 1' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('Project 1');
    });
    
    fireEvent.change(searchInput, { target: { value: 'Project 2' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('Project 2');
    });
  });

  it('handles no search results', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    fireEvent.change(searchInput, { target: { value: 'Non-existent Project' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Non-existent Project');
    });
  });

  it('maintains search state across multiple searches', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    // Perform multiple searches
    fireEvent.change(searchInput, { target: { value: 'Project 1' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('Project 1');
    });
    
    fireEvent.change(searchInput, { target: { value: 'Project 2' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('Project 2');
    });
    
    fireEvent.change(searchInput, { target: { value: 'Project 3' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('Project 3');
    });
  });

  it('handles projects prop changes', () => {
    const { rerender } = render(
      <TestWrapper initialProjects={mockProjects}>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();

    // Change projects prop
    const newProjects: Project[] = [
      {
        id: 3,
        globalVars: [],
        pages: [],
        templateId: 'template3',
        projectInfo: {
          name: 'New Project',
          description: 'New Description',
          reportTitle: 'New Report',
          company: 'New Company',
        },
        testModelId: 3,
        inputBlocks: [],
        testResults: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];

    rerender(
      <TestWrapper initialProjects={newProjects}>
        <ProjectsFilters projects={newProjects} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('handles empty projects array', () => {
    render(
      <TestWrapper initialProjects={[]}>
        <ProjectsFilters projects={[]} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('has correct section structure and styling', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('flex', 'flex-col', 'gap-6');
  });

  it('has correct heading styling', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-xl', 'font-bold', 'tracking-wide');
  });

  it('has correct container div structure', () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    // Try to find the correct container by going up the DOM tree
    const searchInput = screen.getByPlaceholderText('Search projects...');
    const level1 = searchInput.closest('div'); // TextInput wrapper
    const level2 = level1?.parentElement; // relative w-[400px] gap-2
    const level3 = level2?.parentElement; // flex gap-2
    const level4 = level3?.parentElement; // flex items-center justify-between

    expect(level4).toHaveClass('flex', 'items-center', 'justify-between');
    expect(level3).toHaveClass('flex', 'gap-2');
  });

  it('handles rapid consecutive searches', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    
    // Rapid consecutive searches
    fireEvent.change(searchInput, { target: { value: 'A' } });
    fireEvent.change(searchInput, { target: { value: 'AB' } });
    fireEvent.change(searchInput, { target: { value: 'ABC' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('ABC');
    });
  });

  it('clears search when clear button is clicked multiple times', async () => {
    render(
      <TestWrapper>
        <ProjectsFilters projects={mockProjects} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    const clearButton = screen.getByText('Clear');
    
    // Enter text and clear multiple times
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    fireEvent.click(clearButton);
    fireEvent.click(clearButton);
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });
}); 