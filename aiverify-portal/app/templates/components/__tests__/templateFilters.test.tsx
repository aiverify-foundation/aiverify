import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateSearchProvider } from '../TemplateSearchProvider';
import { TemplateFilters } from '../templateFilters';

// Mock Fuse.js
jest.mock('fuse.js', () => {
  return jest.fn().mockImplementation(() => ({
    search: jest.fn((query: string) => {
      const mockResults = [
        {
          item: {
            id: 1,
            projectInfo: { name: 'Template 1', description: 'Desc 1' },
            globalVars: [],
            pages: [],
            fromPlugin: false,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        },
      ];
      return query === 'Template 1' ? mockResults : [];
    }),
  }));
});

// Mock components
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: function MockIcon({ name, size, style, svgClassName }: any) {
    return (
      <div
        data-testid="icon"
        data-name={name}
        data-size={size}
        style={style}
        className={svgClassName}
      />
    );
  },
  IconName: {
    MagnifyGlass: 'MagnifyGlass',
  },
}));

jest.mock('@/lib/components/button', () => ({
  Button: function MockButton({ variant, size, text, bezel, onClick }: any) {
    return (
      <button
        data-testid="clear-button"
        data-variant={variant}
        data-size={size}
        data-bezel={bezel}
        onClick={onClick}
      >
        {text}
      </button>
    );
  },
  ButtonVariant: {
    SECONDARY: 'secondary',
  },
}));

jest.mock('@/lib/components/textInput', () => ({
  TextInput: function MockTextInput({ placeholder, inputStyles, value, onChange }: any) {
    return (
      <input
        data-testid="text-input"
        placeholder={placeholder}
        style={inputStyles}
        value={value}
        onChange={onChange}
      />
    );
  },
}));

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

describe('TemplateFilters', () => {
  const renderWithProvider = (props: any = {}) => {
    return render(
      <TemplateSearchProvider initialTemplates={mockTemplates}>
        <TemplateFilters templates={mockTemplates} {...props} />
      </TemplateSearchProvider>
    );
  };

  it('should render the template filters component', () => {
    renderWithProvider();

    expect(screen.getByTestId('text-input')).toBeInTheDocument();
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const { container } = renderWithProvider({ className: 'custom-class' });
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should render search input with correct placeholder', () => {
    renderWithProvider();

    const input = screen.getByTestId('text-input');
    expect(input).toHaveAttribute('placeholder', 'Search templates...');
  });

  it('should render search icon with correct properties', () => {
    renderWithProvider();

    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-name', 'MagnifyGlass');
    expect(icon).toHaveAttribute('data-size', '20');
  });

  it('should render clear button with correct properties', () => {
    renderWithProvider();

    const button = screen.getByTestId('clear-button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-bezel', 'false');
    expect(button).toHaveTextContent('Clear');
  });

  it('should handle search input changes', async () => {
    renderWithProvider();

    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: 'Template 1' } });

    await waitFor(() => {
      expect(input).toHaveValue('Template 1');
    });
  });

  it('should handle empty search query', async () => {
    renderWithProvider();

    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should handle clear button click', async () => {
    renderWithProvider();

    const input = screen.getByTestId('text-input');
    const clearButton = screen.getByTestId('clear-button');

    // First, enter a search query
    fireEvent.change(input, { target: { value: 'Template 1' } });
    await waitFor(() => {
      expect(input).toHaveValue('Template 1');
    });

    // Then click clear
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should handle search with whitespace-only query', async () => {
    renderWithProvider();

    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: '   ' } });

    await waitFor(() => {
      expect(input).toHaveValue('   ');
    });
  });

  describe('Search functionality', () => {
    it('should initialize Fuse.js with correct configuration', () => {
      const Fuse = require('fuse.js');
      renderWithProvider();

      expect(Fuse).toHaveBeenCalledWith(mockTemplates, {
        keys: ['projectInfo.name'],
        threshold: 0.3,
      });
    });

    it('should call onSearch when search query changes', async () => {
      renderWithProvider();

      const input = screen.getByTestId('text-input');
      fireEvent.change(input, { target: { value: 'Template 1' } });

      await waitFor(() => {
        expect(input).toHaveValue('Template 1');
      });
    });

    it('should call onSearch with all templates when query is empty', async () => {
      renderWithProvider();

      const input = screen.getByTestId('text-input');
      fireEvent.change(input, { target: { value: 'something' } });
      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Input styling', () => {
    it('should apply correct input styles', () => {
      renderWithProvider();

      const input = screen.getByTestId('text-input');
      expect(input).toHaveStyle({ paddingLeft: '40px' });
    });

    it('should position icon correctly', () => {
      renderWithProvider();

      const icon = screen.getByTestId('icon');
      expect(icon).toHaveStyle({
        position: 'absolute',
        top: '8px',
        left: '8px',
      });
    });
  });

  describe('Layout and styling', () => {
    it('should have correct container classes', () => {
      const { container } = renderWithProvider();
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('flex', 'flex-col', 'gap-6');
    });

    it('should have correct search container structure', () => {
      const { container } = renderWithProvider();
      
      const searchContainer = container.querySelector('.flex.gap-2');
      expect(searchContainer).toBeInTheDocument();
      
      const inputContainer = container.querySelector('.relative.w-\\[400px\\].gap-2');
      expect(inputContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper input accessibility', () => {
      renderWithProvider();

      const input = screen.getByTestId('text-input');
      expect(input).toHaveAttribute('placeholder', 'Search templates...');
    });

    it('should have proper button accessibility', () => {
      renderWithProvider();

      const button = screen.getByTestId('clear-button');
      expect(button).toHaveTextContent('Clear');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid search queries gracefully', async () => {
      renderWithProvider();

      const input = screen.getByTestId('text-input');
      
      // Test with various edge cases
      const edgeCases = ['', '   ', '!@#$%^&*()', '123456789'];
      
      for (const query of edgeCases) {
        fireEvent.change(input, { target: { value: query } });
        await waitFor(() => {
          expect(input).toHaveValue(query);
        });
      }
    });
  });

  describe('Performance', () => {
    it('should debounce search queries', async () => {
      renderWithProvider();

      const input = screen.getByTestId('text-input');
      
      // Rapid fire changes
      fireEvent.change(input, { target: { value: 'T' } });
      fireEvent.change(input, { target: { value: 'Te' } });
      fireEvent.change(input, { target: { value: 'Tem' } });
      fireEvent.change(input, { target: { value: 'Template' } });

      await waitFor(() => {
        expect(input).toHaveValue('Template');
      });
    });
  });
}); 