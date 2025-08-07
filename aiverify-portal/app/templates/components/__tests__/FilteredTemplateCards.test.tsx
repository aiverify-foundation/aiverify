import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportTemplate } from '@/app/templates/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { FilteredTemplateCards } from '../FilteredTemplateCards';

// Mock the TemplateCards component
jest.mock('../templateCards', () => ({
  TemplateCards: function MockTemplateCards({ templates, projectId, flow }: any) {
    return (
      <div data-testid="template-cards">
        <div data-testid="templates-count">{templates.length}</div>
        <div data-testid="project-id">{projectId || 'no-project'}</div>
        <div data-testid="flow">{flow || 'no-flow'}</div>
        {templates.map((template: any) => (
          <div key={template.id} data-testid={`template-${template.id}`}>
            {template.projectInfo.name}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock the useTemplateSearch hook
const mockUseTemplateSearch = jest.fn();
jest.mock('../TemplateSearchProvider', () => ({
  useTemplateSearch: () => mockUseTemplateSearch(),
}));

describe('FilteredTemplateCards', () => {
  const mockTemplates: ReportTemplate[] = [
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
      fromPlugin: true,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTemplateSearch.mockReturnValue({
      filteredTemplates: mockTemplates,
    });
  });

  it('should render TemplateCards component', () => {
    render(<FilteredTemplateCards />);

    expect(screen.getByTestId('template-cards')).toBeInTheDocument();
  });

  it('should pass filtered templates from hook to TemplateCards', () => {
    render(<FilteredTemplateCards />);

    expect(screen.getByTestId('templates-count')).toHaveTextContent('2');
    expect(screen.getByTestId('template-1')).toHaveTextContent('Template 1');
    expect(screen.getByTestId('template-2')).toHaveTextContent('Template 2');
  });

  it('should pass projectId prop to TemplateCards', () => {
    const projectId = 'test-project-123';
    render(<FilteredTemplateCards projectId={projectId} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent(projectId);
  });

  it('should pass flow prop to TemplateCards', () => {
    const flow = UserFlows.NewProject;
    render(<FilteredTemplateCards flow={flow} />);

    expect(screen.getByTestId('flow')).toHaveTextContent(flow);
  });

  it('should pass both projectId and flow props to TemplateCards', () => {
    const projectId = 'test-project-123';
    const flow = UserFlows.ViewTemplate;
    
    render(<FilteredTemplateCards projectId={projectId} flow={flow} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent(projectId);
    expect(screen.getByTestId('flow')).toHaveTextContent(flow);
  });

  it('should handle undefined projectId prop', () => {
    render(<FilteredTemplateCards projectId={undefined} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent('no-project');
  });

  it('should handle undefined flow prop', () => {
    render(<FilteredTemplateCards flow={undefined} />);

    expect(screen.getByTestId('flow')).toHaveTextContent('no-flow');
  });

  it('should handle empty filtered templates', () => {
    mockUseTemplateSearch.mockReturnValue({
      filteredTemplates: [],
    });

    render(<FilteredTemplateCards />);

    expect(screen.getByTestId('templates-count')).toHaveTextContent('0');
  });

  it('should handle single filtered template', () => {
    mockUseTemplateSearch.mockReturnValue({
      filteredTemplates: [mockTemplates[0]],
    });

    render(<FilteredTemplateCards />);

    expect(screen.getByTestId('templates-count')).toHaveTextContent('1');
    expect(screen.getByTestId('template-1')).toHaveTextContent('Template 1');
    expect(screen.queryByTestId('template-2')).not.toBeInTheDocument();
  });

  describe('Different user flows', () => {
    it('should work with NewProject flow', () => {
      render(<FilteredTemplateCards flow={UserFlows.NewProject} />);

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.NewProject);
    });

    it('should work with ViewTemplate flow', () => {
      render(<FilteredTemplateCards flow={UserFlows.ViewTemplate} />);

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.ViewTemplate);
    });

    it('should work with NewTemplate flow', () => {
      render(<FilteredTemplateCards flow={UserFlows.NewTemplate} />);

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.NewTemplate);
    });

    it('should work with NewProjectWithExistingTemplate flow', () => {
      render(<FilteredTemplateCards flow={UserFlows.NewProjectWithExistingTemplate} />);

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.NewProjectWithExistingTemplate);
    });

    it('should work with NewProjectWithNewTemplate flow', () => {
      render(<FilteredTemplateCards flow={UserFlows.NewProjectWithNewTemplate} />);

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.NewProjectWithNewTemplate);
    });

    it('should work with NewProjectWithEditingExistingTemplate flow', () => {
      render(<FilteredTemplateCards flow={UserFlows.NewProjectWithEditingExistingTemplate} />);

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.NewProjectWithEditingExistingTemplate);
    });
  });

  describe('Hook integration', () => {
    it('should call useTemplateSearch hook', () => {
      render(<FilteredTemplateCards />);

      expect(mockUseTemplateSearch).toHaveBeenCalled();
    });

    it('should use filteredTemplates from hook', () => {
      const customTemplates = [
        {
          id: 99,
          projectInfo: {
            name: 'Custom Template',
            description: 'Custom Description',
          },
          globalVars: [],
          pages: [],
          fromPlugin: false,
          created_at: '2023-03-01T00:00:00Z',
          updated_at: '2023-03-01T00:00:00Z',
        },
      ];

      mockUseTemplateSearch.mockReturnValue({
        filteredTemplates: customTemplates,
      });

      render(<FilteredTemplateCards />);

      expect(screen.getByTestId('templates-count')).toHaveTextContent('1');
      expect(screen.getByTestId('template-99')).toHaveTextContent('Custom Template');
    });

    it('should handle hook returning different template arrays', () => {
      const firstRender = [mockTemplates[0]];
      const secondRender = mockTemplates;

      mockUseTemplateSearch.mockReturnValue({
        filteredTemplates: firstRender,
      });

      const { rerender } = render(<FilteredTemplateCards />);
      expect(screen.getByTestId('templates-count')).toHaveTextContent('1');

      mockUseTemplateSearch.mockReturnValue({
        filteredTemplates: secondRender,
      });

      rerender(<FilteredTemplateCards />);
      expect(screen.getByTestId('templates-count')).toHaveTextContent('2');
    });
  });

  describe('Component integration', () => {
    it('should pass all required props to TemplateCards', () => {
      const projectId = 'integration-test';
      const flow = UserFlows.NewProject;
      
      render(<FilteredTemplateCards projectId={projectId} flow={flow} />);

      // Verify all props are passed correctly
      expect(screen.getByTestId('template-cards')).toBeInTheDocument();
      expect(screen.getByTestId('templates-count')).toHaveTextContent('2');
      expect(screen.getByTestId('project-id')).toHaveTextContent(projectId);
      expect(screen.getByTestId('flow')).toHaveTextContent(flow);
    });

    it('should maintain template structure when passing to TemplateCards', () => {
      render(<FilteredTemplateCards />);

      // Check that template data is preserved
      expect(screen.getByTestId('template-1')).toHaveTextContent('Template 1');
      expect(screen.getByTestId('template-2')).toHaveTextContent('Template 2');
    });
  });

  describe('Props interface', () => {
    it('should accept projectId as string', () => {
      expect(() => {
        render(<FilteredTemplateCards projectId="string-project-id" />);
      }).not.toThrow();
    });

    it('should accept projectId as undefined', () => {
      expect(() => {
        render(<FilteredTemplateCards projectId={undefined} />);
      }).not.toThrow();
    });

    it('should accept flow as UserFlows enum', () => {
      expect(() => {
        render(<FilteredTemplateCards flow={UserFlows.NewProject} />);
      }).not.toThrow();
    });

    it('should accept flow as undefined', () => {
      expect(() => {
        render(<FilteredTemplateCards flow={undefined} />);
      }).not.toThrow();
    });

    it('should accept both props as undefined', () => {
      expect(() => {
        render(<FilteredTemplateCards />);
      }).not.toThrow();
    });
  });
}); 