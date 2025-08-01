import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PluginsPanel } from '../pluginsPanel';
import type { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';

// Mock Fuse.js
jest.mock('fuse.js', () => {
  return jest.fn().mockImplementation((items, options) => ({
    search: jest.fn().mockReturnValue(
      items.map((item: any) => ({ item }))
    ),
  }));
});

// Mock the accordion components
jest.mock('@/lib/components/accordion', () => ({
  Accordion: ({ children, type, collapsible }: any) => (
    <div data-testid="accordion" data-type={type} data-collapsible={collapsible}>
      {children}
    </div>
  ),
  AccordionItem: ({ children, value }: any) => (
    <div data-testid="accordion-item" data-value={value}>
      {children}
    </div>
  ),
  AccordionTrigger: ({ children }: any) => (
    <button data-testid="accordion-trigger">
      {children}
    </button>
  ),
  AccordionContent: ({ children }: any) => (
    <div data-testid="accordion-content">
      {children}
    </div>
  ),
}));

// Mock the TextInput component
jest.mock('@/lib/components/textInput', () => ({
  TextInput: ({ value, onChange, placeholder, className }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

describe('PluginsPanel', () => {
  const mockWidgets: WidgetOnGridLayout[] = [
    {
      cid: 'widget1',
      name: 'Test Widget 1',
      version: '1.0.0',
      author: 'Test Author',
      description: 'A test widget',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      gid: 'plugin1',
      mdx: {
        code: 'test mdx code',
        frontmatter: {},
      },
      gridItemId: 'widget1-grid',
    },
    {
      cid: 'widget2',
      name: 'Test Widget 2',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Another test widget',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      gid: 'plugin1',
      mdx: {
        code: 'test mdx code 2',
        frontmatter: {},
      },
      gridItemId: 'widget2-grid',
    },
    {
      cid: 'widget3',
      name: 'Test Widget 3',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Third test widget',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      gid: 'plugin2',
      mdx: {
        code: 'test mdx code 3',
        frontmatter: {},
      },
      gridItemId: 'widget3-grid',
    },
  ];

  const mockPlugins: PluginForGridLayout[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test plugin description',
      url: 'https://test.com',
      meta: 'test meta',
      is_stock: true,
      zip_hash: 'test-hash',
      algorithms: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      widgets: [mockWidgets[0], mockWidgets[1]],
    },
    {
      gid: 'plugin2',
      version: '1.0.0',
      name: 'Test Plugin 2',
      author: 'Test Author',
      description: 'Test plugin description 2',
      url: 'https://test2.com',
      meta: 'test meta 2',
      is_stock: false,
      zip_hash: 'test-hash-2',
      algorithms: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      widgets: [mockWidgets[2]],
    },
  ];

  const defaultProps = {
    plugins: mockPlugins,
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders plugins panel with search input', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('accordion')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <PluginsPanel {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders all plugins in accordion', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const accordionItems = screen.getAllByTestId('accordion-item');
      expect(accordionItems).toHaveLength(2);
    });

    it('renders plugin names in accordion triggers', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      expect(screen.getByText('Test Plugin 1')).toBeInTheDocument();
      expect(screen.getByText('Test Plugin 2')).toBeInTheDocument();
    });

    it('renders widget counts for each plugin', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      expect(screen.getByText('2 widgets')).toBeInTheDocument();
      expect(screen.getByText('1 widget')).toBeInTheDocument();
    });

    it('renders all widgets in accordion content', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      expect(screen.getByText('Test Widget 1')).toBeInTheDocument();
      expect(screen.getByText('Test Widget 2')).toBeInTheDocument();
      expect(screen.getByText('Test Widget 3')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('updates search value when typing', async () => {
      const user = userEvent.setup();
      render(<PluginsPanel {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      
      expect(searchInput).toHaveValue('test');
    });

    it('filters plugins when search value is entered', async () => {
      const user = userEvent.setup();
      render(<PluginsPanel {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Plugin 1');
      
      // Fuse.js should be called with the search term
      // The mock implementation returns all items, so we check that the search was triggered
      await waitFor(() => {
        expect(searchInput).toHaveValue('Plugin 1');
      });
    });

    it('shows all plugins when search is empty', async () => {
      const user = userEvent.setup();
      render(<PluginsPanel {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.clear(searchInput);
      
      expect(searchInput).toHaveValue('');
    });

    it('handles search with special characters', async () => {
      const user = userEvent.setup();
      render(<PluginsPanel {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test@#$%');
      
      expect(searchInput).toHaveValue('test@#$%');
    });
  });

  describe('Drag and Drop', () => {
    it('sets up drag events for widgets', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widgetElements = screen.getAllByText(/Test Widget/);
      expect(widgetElements.length).toBeGreaterThan(0);
      
      // Each widget should be draggable
      widgetElements.forEach(widget => {
        expect(widget).toHaveAttribute('draggable', 'true');
      });
    });

    it('calls onDragStart when widget drag starts', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widget = screen.getByText('Test Widget 1');
      
      fireEvent.dragStart(widget, {
        dataTransfer: {
          setData: jest.fn(),
          effectAllowed: '',
        },
      });
      
      expect(defaultProps.onDragStart).toHaveBeenCalledWith(mockWidgets[0]);
    });

    it('calls onDragEnd when widget drag ends', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widget = screen.getByText('Test Widget 1');
      
      fireEvent.dragEnd(widget);
      
      expect(defaultProps.onDragEnd).toHaveBeenCalled();
    });

    it('sets correct data transfer on drag start', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widget = screen.getByText('Test Widget 1');
      const setDataMock = jest.fn();
      
      fireEvent.dragStart(widget, {
        dataTransfer: {
          setData: setDataMock,
          effectAllowed: '',
        },
      });
      
      expect(setDataMock).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify({
          gid: 'plugin1',
          cid: 'widget1',
        })
      );
    });

    it('sets effectAllowed to copy on drag start', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widget = screen.getByText('Test Widget 1');
      const dataTransfer = {
        setData: jest.fn(),
        effectAllowed: '',
      };
      
      fireEvent.dragStart(widget, { dataTransfer });
      
      expect(dataTransfer.effectAllowed).toBe('copy');
    });
  });

  describe('Plugin Sorting', () => {
    it('sorts plugins alphabetically by name', () => {
      const unsortedPlugins: PluginForGridLayout[] = [
        {
          gid: 'plugin3',
          version: '1.0.0',
          name: 'Zebra Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: [],
        },
        {
          gid: 'plugin1',
          version: '1.0.0',
          name: 'Alpha Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: [],
        },
        {
          gid: 'plugin2',
          version: '1.0.0',
          name: 'Beta Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: [],
        },
      ];

      render(<PluginsPanel {...defaultProps} plugins={unsortedPlugins} />);
      
      const accordionItems = screen.getAllByTestId('accordion-item');
      expect(accordionItems).toHaveLength(3);
      
      // Check that plugins are rendered in alphabetical order
      const triggers = screen.getAllByTestId('accordion-trigger');
      expect(triggers[0]).toHaveTextContent('Alpha Plugin');
      expect(triggers[1]).toHaveTextContent('Beta Plugin');
      expect(triggers[2]).toHaveTextContent('Zebra Plugin');
    });

    it('sorts widgets alphabetically within each plugin', () => {
      const pluginsWithUnsortedWidgets: PluginForGridLayout[] = [
        {
          gid: 'plugin1',
          version: '1.0.0',
          name: 'Test Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: [
            {
              cid: 'widget3',
              name: 'Zebra Widget',
              version: '1.0.0',
              author: 'Test Author',
              description: 'Z widget',
              widgetSize: {
                minW: 1,
                minH: 1,
                maxW: 12,
                maxH: 12,
              },
              properties: [],
              tags: 'test',
              dependencies: [],
              mockdata: [],
              dynamicHeight: false,
              gid: 'plugin1',
              mdx: {
                code: 'z mdx',
                frontmatter: {},
              },
              gridItemId: 'widget3-grid',
            },
            {
              cid: 'widget1',
              name: 'Alpha Widget',
              version: '1.0.0',
              author: 'Test Author',
              description: 'A widget',
              widgetSize: {
                minW: 1,
                minH: 1,
                maxW: 12,
                maxH: 12,
              },
              properties: [],
              tags: 'test',
              dependencies: [],
              mockdata: [],
              dynamicHeight: false,
              gid: 'plugin1',
              mdx: {
                code: 'a mdx',
                frontmatter: {},
              },
              gridItemId: 'widget1-grid',
            },
            {
              cid: 'widget2',
              name: 'Beta Widget',
              version: '1.0.0',
              author: 'Test Author',
              description: 'B widget',
              widgetSize: {
                minW: 1,
                minH: 1,
                maxW: 12,
                maxH: 12,
              },
              properties: [],
              tags: 'test',
              dependencies: [],
              mockdata: [],
              dynamicHeight: false,
              gid: 'plugin1',
              mdx: {
                code: 'b mdx',
                frontmatter: {},
              },
              gridItemId: 'widget2-grid',
            },
          ],
        },
      ];

      render(<PluginsPanel {...defaultProps} plugins={pluginsWithUnsortedWidgets} />);
      
      // Widgets should be rendered in alphabetical order
      const widgetElements = screen.getAllByText(/Widget$/);
      expect(widgetElements[0]).toHaveTextContent('Alpha Widget');
      expect(widgetElements[1]).toHaveTextContent('Beta Widget');
      expect(widgetElements[2]).toHaveTextContent('Zebra Widget');
    });
  });

  describe('Widget Styling', () => {
    it('applies correct styling classes to widgets', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widget = screen.getByText('Test Widget 1');
      expect(widget).toHaveClass(
        'cursor-grab',
        'rounded-md',
        'border',
        'border-gray-400',
        'p-2',
        'text-gray-400',
        'hover:bg-secondary-1000',
        'active:cursor-grabbing'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty plugins array', () => {
      render(<PluginsPanel {...defaultProps} plugins={[]} />);
      
      expect(screen.getByTestId('accordion')).toBeInTheDocument();
      expect(screen.queryByTestId('accordion-item')).not.toBeInTheDocument();
    });

    it('handles plugins with no widgets', () => {
      const pluginsWithoutWidgets: PluginForGridLayout[] = [
        {
          gid: 'plugin1',
          version: '1.0.0',
          name: 'Empty Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: [],
        },
      ];

      render(<PluginsPanel {...defaultProps} plugins={pluginsWithoutWidgets} />);
      
      expect(screen.getByText('Empty Plugin')).toBeInTheDocument();
      expect(screen.getByText('0 widgets')).toBeInTheDocument();
    });

    it('handles plugins with null or undefined widgets', () => {
      const pluginsWithNullWidgets: PluginForGridLayout[] = [
        {
          gid: 'plugin1',
          version: '1.0.0',
          name: 'Test Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: null as any,
        },
      ];

      // Should not crash
      expect(() => {
        render(<PluginsPanel {...defaultProps} plugins={pluginsWithNullWidgets} />);
      }).not.toThrow();
    });

    it('handles widgets with missing properties', () => {
      const pluginsWithIncompleteWidgets: PluginForGridLayout[] = [
        {
          gid: 'plugin1',
          version: '1.0.0',
          name: 'Test Plugin',
          author: 'Test Author',
          description: 'Test plugin description',
          url: 'https://test.com',
          meta: 'test meta',
          is_stock: true,
          zip_hash: 'test-hash',
          algorithms: [],
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          widgets: [
            {
              cid: 'widget1',
              name: 'Test Widget',
              version: '1.0.0',
              author: 'Test Author',
              description: undefined as any,
              widgetSize: {
                minW: 1,
                minH: 1,
                maxW: 12,
                maxH: 12,
              },
              properties: [],
              tags: 'test',
              dependencies: [],
              mockdata: [],
              dynamicHeight: false,
              gid: 'plugin1',
              mdx: {
                code: 'test mdx',
                frontmatter: {},
              },
              gridItemId: 'widget1-grid',
            },
          ],
        },
      ];

      render(<PluginsPanel {...defaultProps} plugins={pluginsWithIncompleteWidgets} />);
      
      expect(screen.getByText('Test Widget')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper search input attributes', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search plugins...');
    });

    it('provides proper drag feedback', () => {
      render(<PluginsPanel {...defaultProps} />);
      
      const widget = screen.getByText('Test Widget 1');
      expect(widget).toHaveAttribute('draggable', 'true');
    });
  });

  describe('Integration Scenarios', () => {
    it('works correctly with search and drag operations', async () => {
      const user = userEvent.setup();
      render(<PluginsPanel {...defaultProps} />);
      
      // Search for a specific widget
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Widget 1');
      
      // Drag the widget
      const widget = screen.getByText('Test Widget 1');
      fireEvent.dragStart(widget, {
        dataTransfer: {
          setData: jest.fn(),
          effectAllowed: '',
        },
      });
      
      expect(defaultProps.onDragStart).toHaveBeenCalledWith(mockWidgets[0]);
    });

    it('handles rapid search changes', async () => {
      const user = userEvent.setup();
      render(<PluginsPanel {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Rapidly change search terms
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.type(searchInput, 'widget');
      await user.clear(searchInput);
      await user.type(searchInput, 'plugin');
      
      expect(searchInput).toHaveValue('plugin');
    });
  });
}); 