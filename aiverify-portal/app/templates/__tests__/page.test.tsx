import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { notFound } from 'next/navigation';
import { UserFlows } from '@/app/userFlowsEnum';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { fetchTemplates } from '@/lib/fetchApis/getTemplates';
import TemplatesPage from '../page';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getProjects', () => ({
  getProjects: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getTemplates', () => ({
  fetchTemplates: jest.fn(),
}));

// Mock the child components
jest.mock('../components/ActionButtons', () => {
  return function MockActionButtons() {
    return <div data-testid="action-buttons">Action Buttons</div>;
  };
});

jest.mock('../components/CreateTemplateCard', () => {
  return {
    CreateTemplateCard: function MockCreateTemplateCard({ projectId, flow }: any) {
      return (
        <div data-testid="create-template-card">
          Create Template Card - Project: {projectId}, Flow: {flow}
        </div>
      );
    },
  };
});

jest.mock('../components/QueryProvider', () => {
  return {
    QueryProvider: function MockQueryProvider({ children }: any) {
      return <div data-testid="query-provider">{children}</div>;
    },
  };
});

jest.mock('../components/templateCards', () => {
  return {
    TemplateCards: function MockTemplateCards({ templates, projectId, flow }: any) {
      return (
        <div data-testid="template-cards">
          Template Cards - Count: {templates.length}, Project: {projectId}, Flow: {flow}
        </div>
      );
    },
  };
});

jest.mock('../components/templateFilters', () => {
  return {
    TemplateFilters: function MockTemplateFilters({ templates }: any) {
      return (
        <div data-testid="template-filters">
          Template Filters - Count: {templates.length}
        </div>
      );
    },
  };
});

jest.mock('@/app/templates/components/TemplateSearchProvider', () => {
  return {
    TemplateSearchProvider: function MockTemplateSearchProvider({ children, initialTemplates }: any) {
      return (
        <div data-testid="template-search-provider">
          Search Provider - Templates: {initialTemplates.length}
          {children}
        </div>
      );
    },
  };
});

jest.mock('@/app/templates/components/FilteredTemplateCards', () => {
  return {
    FilteredTemplateCards: function MockFilteredTemplateCards({ projectId, flow }: any) {
      return (
        <div data-testid="filtered-template-cards">
          Filtered Template Cards - Project: {projectId}, Flow: {flow}
        </div>
      );
    },
  };
});

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: function MockIcon({ name, size, color }: any) {
    return <div data-testid="icon" data-name={name} data-size={size} data-color={color} />;
  },
  IconName: {
    OpenedBook: 'OpenedBook',
  },
}));

const mockGetProjects = getProjects as jest.MockedFunction<typeof getProjects>;
const mockFetchTemplates = fetchTemplates as jest.MockedFunction<typeof fetchTemplates>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe('TemplatesPage', () => {
  const mockTemplates = [
    {
      id: 1,
      projectInfo: {
        name: 'Template 1',
        description: 'Description 1',
      },
      globalVars: [],
      pages: [],
      fromPlugin: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      projectInfo: {
        name: 'Template 2',
        description: 'Description 2',
      },
      globalVars: [],
      pages: [],
      fromPlugin: false,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const mockProject = {
    id: 'project-123',
    projectInfo: {
      name: 'Test Project',
      description: 'Test Project Description',
    },
    globalVars: [],
    pages: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render the templates page with default content', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Report Templates')).toBeInTheDocument();
        expect(screen.getByText('Browse and manage report templates.')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      });
    });

    it('should render with search provider when templates length > 1', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('template-search-provider')).toBeInTheDocument();
        expect(screen.getByTestId('template-filters')).toBeInTheDocument();
        expect(screen.getByTestId('filtered-template-cards')).toBeInTheDocument();
      });
    });

    it('should render without search provider when templates length <= 1', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: [mockTemplates[0]],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.queryByTestId('template-search-provider')).not.toBeInTheDocument();
        expect(screen.queryByTestId('template-filters')).not.toBeInTheDocument();
        expect(screen.getByTestId('template-cards')).toBeInTheDocument();
      });
    });
  });

  describe('Project flow handling', () => {
    it('should handle project flow with valid project', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      } as any);
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText(`Select A Report Template for ${mockProject.projectInfo.name}`)).toBeInTheDocument();
        expect(screen.getByText('Select a template or start with an empty canvas.')).toBeInTheDocument();
      });
    });

    it('should call notFound when project is not found', async () => {
      // Mock notFound to throw an error as expected
      mockNotFound.mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });
      
      mockGetProjects.mockResolvedValue({
        data: [],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({
        projectId: 'nonexistent-project',
        flow: UserFlows.NewProject,
      });

      await expect(TemplatesPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when getProjects returns error', async () => {
      // Mock notFound to throw an error as expected
      mockNotFound.mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });
      
      mockGetProjects.mockResolvedValue({
        message: 'Project not found',
      } as any);
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      await expect(TemplatesPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe('Template fetching', () => {
    it('should throw error when fetchTemplates fails', async () => {
      mockFetchTemplates.mockResolvedValue({
        message: 'Failed to fetch templates',
      } as any);

      const searchParams = Promise.resolve({});

      await expect(TemplatesPage({ searchParams })).rejects.toThrow('Failed to fetch templates');
    });

    it('should handle empty templates array', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: [],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Report Templates')).toBeInTheDocument();
        expect(screen.getByTestId('template-cards')).toBeInTheDocument();
      });
    });
  });

  describe('User flows', () => {
    it('should handle different user flows correctly', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const flows = [
        UserFlows.NewProject,
        UserFlows.ViewTemplate,
        UserFlows.NewTemplate,
      ];

      for (const flow of flows) {
        const searchParams = Promise.resolve({
          projectId: 'project-123',
          flow,
        });

        mockGetProjects.mockResolvedValue({
          data: [mockProject],
          status: 200,
          code: 'SUCCESS',
        } as any);

        render(await TemplatesPage({ searchParams }));

        await waitFor(() => {
          expect(screen.getByTestId('create-template-card')).toBeInTheDocument();
        });

        // Clear the DOM for next iteration
        document.body.innerHTML = '';
      }
    });
  });

  describe('Icon and styling', () => {
    it('should render icon with correct properties', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        const icon = screen.getByTestId('icon');
        expect(icon).toHaveAttribute('data-name', 'OpenedBook');
        expect(icon).toHaveAttribute('data-size', '40');
        expect(icon).toHaveAttribute('data-color', '#FFFFFF');
      });
    });

    it('should have proper CSS classes and structure', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toHaveClass('w-full', 'p-6');
      });
    });
  });

  describe('Conditional rendering', () => {
    it('should show action buttons when not in project flow', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      });
    });

    it('should hide action buttons when in project flow', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      } as any);
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent('Report Templates');
      });
    });

    it('should have proper main landmark', async () => {
      mockFetchTemplates.mockResolvedValue({
        data: mockTemplates,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({});
      render(await TemplatesPage({ searchParams }));

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
      });
    });
  });
}); 