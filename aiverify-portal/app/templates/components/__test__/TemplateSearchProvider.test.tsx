import { render, screen, act, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateSearchProvider, useTemplateSearch } from '../TemplateSearchProvider';

// Mock templates data for tests
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

// Test component to use the hook
function TestComponent() {
  const { filteredTemplates, onSearch } = useTemplateSearch();

  return (
    <div>
      <div data-testid="templates-count">{filteredTemplates.length}</div>
      <div data-testid="templates-data">
        {filteredTemplates.map((template) => (
          <div key={template.id} data-testid={`template-${template.id}`}>
            {template.projectInfo.name}
          </div>
        ))}
      </div>
      <button
        data-testid="search-button"
        onClick={() => onSearch([filteredTemplates[0]])}
      >
        Search
      </button>
    </div>
  );
}

describe('TemplateSearchProvider', () => {
  it('should render children correctly', () => {
    render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <div data-testid="child">Child content</div>
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should provide initial templates to context', () => {
    render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <TestComponent />
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('templates-count')).toHaveTextContent('2');
    expect(screen.getByTestId('template-1')).toHaveTextContent('Template 1');
    expect(screen.getByTestId('template-2')).toHaveTextContent('Template 2');
  });

  it('should update filtered templates when onSearch is called', () => {
    render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <TestComponent />
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('templates-count')).toHaveTextContent('2');

    act(() => {
      screen.getByTestId('search-button').click();
    });

    expect(screen.getByTestId('templates-count')).toHaveTextContent('1');
    expect(screen.getByTestId('template-1')).toBeInTheDocument();
    expect(screen.queryByTestId('template-2')).not.toBeInTheDocument();
  });

  it('should handle empty initial templates', () => {
    render(
      <TemplateSearchProvider initialTemplates={[]}>
        <TestComponent />
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('templates-count')).toHaveTextContent('0');
  });

  it('should handle multiple children', () => {
    render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  describe('Context value', () => {
    it('should provide filteredTemplates', () => {
      render(
        <TemplateSearchProvider initialTemplates={mockTemplates}>
          <TestComponent />
        </TemplateSearchProvider>
      );

      expect(screen.getByTestId('templates-count')).toHaveTextContent('2');
    });

    it('should provide onSearch function', () => {
      render(
        <TemplateSearchProvider initialTemplates={mockTemplates}>
          <TestComponent />
        </TemplateSearchProvider>
      );

      expect(screen.getByTestId('search-button')).toBeInTheDocument();
    });
  });

  describe('State management', () => {
    it('should maintain state across re-renders', () => {
      const { rerender } = render(
        <TemplateSearchProvider initialTemplates={[mockTemplates[0]]}>
          <TestComponent />
        </TemplateSearchProvider>
      );

      expect(screen.getByTestId('templates-count')).toHaveTextContent('1');

      // Rerender with new templates - state should remain unchanged as component doesn't sync with new initialTemplates
      rerender(
        <TemplateSearchProvider initialTemplates={mockTemplates}>
          <TestComponent />
        </TemplateSearchProvider>
      );

      // The context should maintain the old state (component doesn't update when initialTemplates change)
      expect(screen.getByTestId('templates-count')).toHaveTextContent('1');
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside provider', () => {
      function TestComponentWithoutProvider() {
        return <div data-testid="no-provider">Testing without provider</div>;
      }

      // Test that the error is thrown
      expect(() => {
        render(
          <TestComponentWithoutProvider />
        );
        // Try to use the hook outside provider
        renderHook(() => useTemplateSearch());
      }).toThrow('useTemplateSearch must be used within a TemplateSearchProvider');
    });
  });
});

describe('useTemplateSearch', () => {
  it('should return context values when used within provider', () => {
    function TestContextValues() {
      const context = useTemplateSearch();
      return (
        <div>
          <div data-testid="has-filtered-templates">
            {context.filteredTemplates ? 'true' : 'false'}
          </div>
          <div data-testid="has-on-search">
            {typeof context.onSearch === 'function' ? 'true' : 'false'}
          </div>
        </div>
      );
    }

    render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <TestContextValues />
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('has-filtered-templates')).toHaveTextContent('true');
    expect(screen.getByTestId('has-on-search')).toHaveTextContent('true');
  });
});

describe('TemplateSearchProvider integration', () => {
  it('should handle complex filtering scenarios', () => {
    function ComplexTestComponent() {
      const { filteredTemplates, onSearch } = useTemplateSearch();

      const handleFilterByName = (name: string) => {
        const filtered = mockTemplates.filter(template => 
          template.projectInfo.name.includes(name)
        );
        onSearch(filtered);
      };

      return (
        <div>
          <div data-testid="templates-count">{filteredTemplates.length}</div>
          <button
            data-testid="filter-template-1"
            onClick={() => handleFilterByName('Template 1')}
          >
            Filter Template 1
          </button>
          <button
            data-testid="clear-filter"
            onClick={() => onSearch(mockTemplates)}
          >
            Clear Filter
          </button>
        </div>
      );
    }

    render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <ComplexTestComponent />
      </TemplateSearchProvider>
    );

    expect(screen.getByTestId('templates-count')).toHaveTextContent('2');

    act(() => {
      screen.getByTestId('filter-template-1').click();
    });

    expect(screen.getByTestId('templates-count')).toHaveTextContent('1');

    act(() => {
      screen.getByTestId('clear-filter').click();
    });

    expect(screen.getByTestId('templates-count')).toHaveTextContent('2');
  });
}); 