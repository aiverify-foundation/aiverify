import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Plugin } from '@/app/plugins/utils/types';
import PluginCard from '../PluginCard';

// Mock Card component
jest.mock('@/lib/components/card/card', () => ({
  Card: ({ children, className, style, cardColor, enableTiltEffect, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid="card"
      className={className}
      style={style}
      data-card-color={cardColor}
      data-enable-tilt={enableTiltEffect}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  ),
}));

// Mock Card.Content
jest.mock('@/lib/components/card/card', () => {
  const MockCard = ({ children, className, style, cardColor, enableTiltEffect, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid="card"
      className={className}
      style={style}
      data-card-color={cardColor}
      data-enable-tilt={enableTiltEffect}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
  
  MockCard.Content = ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  );
  
  return { Card: MockCard };
});

describe('PluginCard Component', () => {
  const mockPlugin: Plugin = {
    gid: '123',
    version: '1.0.0',
    name: 'Test Plugin',
    author: 'Test Author',
    description: 'Test Description',
    url: 'https://test.com',
    meta: 'test meta',
    is_stock: false,
    zip_hash: 'testhash',
    algorithms: [
      {
        cid: 'algo1',
        gid: '123',
        name: 'Test Algorithm',
        modelType: ['classification'],
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Algorithm Description',
        tags: ['test'],
        requireGroundTruth: true,
        language: 'python',
        script: 'test.py',
        module_name: 'test_module',
        inputSchema: {
          title: 'Test Input Schema',
          description: 'Test Description',
          type: 'object',
          required: ['param1'],
          properties: {},
        },
        outputSchema: {
          title: 'Test Output Schema',
          description: 'Test Description',
          type: 'object',
          required: ['result'],
          minProperties: 1,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Feature names',
              minItems: 1,
              items: { type: 'string' },
            },
            results: {
              title: 'Results',
              description: 'Algorithm results',
              type: 'array',
              minItems: 1,
              items: {
                description: 'Result item',
                type: 'object',
                required: ['indices'],
                minProperties: 1,
                properties: {
                  indices: {
                    description: 'Array of indices',
                    type: 'array',
                    items: { type: 'number' },
                  },
                  ale: {
                    description: 'ALE values',
                    type: 'array',
                    items: { type: 'number' },
                  },
                  size: {
                    description: 'Size values',
                    type: 'array',
                    items: { type: 'number' },
                  },
                },
              },
            },
          },
        } as any,
        zip_hash: 'algohash',
      },
    ],
    widgets: [
      {
        cid: 'widget1',
        name: 'Test Widget',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Widget Description',
        widgetSize: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
        properties: [{ key: 'test', helper: 'test helper', default: 'test' }],
        tags: 'test',
        dependencies: [],
        mockdata: null,
        dynamicHeight: false,
        gid: '123',
      },
    ],
    input_blocks: [
      {
        gid: '123',
        cid: 'input1',
        name: 'Test Input Block',
        description: 'Test Input Block Description',
        group: 'test',
        width: '100%',
        version: '1.0.0',
        author: 'Test Author',
        tags: 'test',
        groupNumber: 1,
        fullScreen: false,
      },
    ],
    templates: [
      {
        cid: 'template1',
        name: 'Test Template',
        description: 'Test Template Description',
        author: 'Test Author',
        version: '1.0.0',
        tags: 'test',
        gid: '123',
      },
    ],
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T12:00:00',
  };

  const mockPluginMinimal: Plugin = {
    gid: '456',
    version: '2.0.0',
    name: 'Minimal Plugin',
    author: null,
    description: null,
    url: null,
    meta: '',
    is_stock: true,
    zip_hash: 'minimalhash',
    algorithms: [],
    widgets: [],
    input_blocks: [],
    templates: [],
    created_at: '2023-02-01T00:00:00',
    updated_at: '2023-02-01T00:00:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<PluginCard plugin={mockPlugin} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders plugin name as heading', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Plugin');
      expect(heading).toHaveClass('mb-2', 'text-lg', 'font-semibold', 'text-white');
    });

    it('renders plugin metadata correctly', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('Installed on:')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats and displays installation date correctly', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      // The date should be formatted as British locale
      const expectedDate = new Date('2023-01-01T12:00:00Z').toLocaleString('en-GB');
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it('handles different date formats', () => {
      const pluginWithDifferentDate = {
        ...mockPlugin,
        updated_at: '2023-12-25T23:59:59',
      };
      
      render(<PluginCard plugin={pluginWithDifferentDate} />);
      
      const expectedDate = new Date('2023-12-25T23:59:59Z').toLocaleString('en-GB');
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });

  describe('Component Counts and Tags', () => {
    it('displays widget count when widgets exist', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const widgetTag = screen.getByText('widgets: 1');
      expect(widgetTag).toBeInTheDocument();
      expect(widgetTag).toHaveClass('rounded', 'bg-white', 'px-2', 'py-1', 'text-sm', 'text-secondary-950');
    });

    it('displays algorithm count when algorithms exist', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const algorithmTag = screen.getByText('algorithms: 1');
      expect(algorithmTag).toBeInTheDocument();
    });

    it('displays input blocks count when input blocks exist', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const inputBlockTag = screen.getByText('input blocks: 1');
      expect(inputBlockTag).toBeInTheDocument();
    });

    it('displays templates count when templates exist', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const templatesTag = screen.getByText('templates: 1');
      expect(templatesTag).toBeInTheDocument();
    });

    it('does not display tags for empty component arrays', () => {
      render(<PluginCard plugin={mockPluginMinimal} />);
      
      expect(screen.queryByText(/widgets:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/algorithms:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/input blocks:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/templates:/)).not.toBeInTheDocument();
    });
  });

  describe('Card Configuration', () => {
    it('configures Card component with correct props', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-card-color', 'var(--color-secondary-950)');
      expect(card).toHaveAttribute('data-enable-tilt', 'false');
      expect(card).toHaveAttribute('aria-label', 'Plugin card for Test Plugin');
    });

    it('applies correct CSS classes to card', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'mb-4',
        'w-full',
        'shadow-md',
        'transition-shadow',
        'duration-200',
        'hover:shadow-lg'
      );
    });

    it('applies correct inline styles to card', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const card = screen.getByTestId('card');
      const style = card.getAttribute('style');
      expect(style).toContain('border: 1px solid var(--color-secondary-300)');
      expect(style).toContain('border-radius: 0.5rem');
      expect(style).toContain('padding: 1rem');
      expect(style).toContain('width: 100%');
      expect(style).toContain('height: auto');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'Plugin card for Test Plugin');
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveAttribute('aria-level', '3');
      
      const metadataGroup = screen.getByLabelText('Plugin metadata');
      expect(metadataGroup).toHaveAttribute('role', 'group');
      
      const tagsGroup = screen.getByLabelText('Plugin tags');
      expect(tagsGroup).toHaveAttribute('role', 'group');
    });

    it('provides descriptive ARIA labels for metadata', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const versionLabel = screen.getByLabelText('Version 1.0.0');
      expect(versionLabel).toBeInTheDocument();
      
      const authorLabel = screen.getByLabelText('Author Test Author');
      expect(authorLabel).toBeInTheDocument();
    });

    it('provides descriptive ARIA labels for component counts', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const widgetCount = screen.getByLabelText('Widgets count: 1');
      expect(widgetCount).toBeInTheDocument();
      
      const algorithmCount = screen.getByLabelText('Algorithms count: 1');
      expect(algorithmCount).toBeInTheDocument();
      
      const inputBlockCount = screen.getByLabelText('Input blocks count: 1');
      expect(inputBlockCount).toBeInTheDocument();
      
      const templateCount = screen.getByLabelText('Templates count: 1');
      expect(templateCount).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null author gracefully', () => {
      render(<PluginCard plugin={mockPluginMinimal} />);
      
      expect(screen.getByText('Author:')).toBeInTheDocument();
      // Should render empty or null value
    });

    it('handles large component counts', () => {
      const pluginWithManyComponents = {
        ...mockPlugin,
        widgets: Array(50).fill(mockPlugin.widgets[0]),
        algorithms: Array(25).fill(mockPlugin.algorithms[0]),
        input_blocks: Array(10).fill(mockPlugin.input_blocks[0]),
        templates: Array(5).fill(mockPlugin.templates[0]),
      };
      
      render(<PluginCard plugin={pluginWithManyComponents} />);
      
      expect(screen.getByText('widgets: 50')).toBeInTheDocument();
      expect(screen.getByText('algorithms: 25')).toBeInTheDocument();
      expect(screen.getByText('input blocks: 10')).toBeInTheDocument();
      expect(screen.getByText('templates: 5')).toBeInTheDocument();
    });

    it('handles very long plugin names', () => {
      const pluginWithLongName = {
        ...mockPlugin,
        name: 'This is a very long plugin name that might cause layout issues if not handled properly',
      };
      
      render(<PluginCard plugin={pluginWithLongName} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(pluginWithLongName.name);
    });
  });

  describe('DOM Structure', () => {
    it('maintains correct DOM hierarchy', () => {
      render(<PluginCard plugin={mockPlugin} />);
      
      const card = screen.getByTestId('card');
      const cardContent = screen.getByTestId('card-content');
      const heading = screen.getByRole('heading', { level: 3 });
      const metadataGroup = screen.getByLabelText('Plugin metadata');
      const tagsGroup = screen.getByLabelText('Plugin tags');
      
      expect(card).toContainElement(cardContent);
      expect(cardContent).toContainElement(heading);
      expect(cardContent).toContainElement(metadataGroup);
      expect(cardContent).toContainElement(tagsGroup);
    });
  });
}); 