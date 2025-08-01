import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import PluginsFilters from '../FilterButtons';
import { Plugin } from '@/app/plugins/utils/types';

// Mock the components
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, style, svgClassName, onClick, role, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid={`icon-${name}`}
      data-size={size}
      style={style}
      className={svgClassName}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
    >
      {name}
    </div>
  ),
  IconName: {
    MagnifyGlass: 'MagnifyGlass',
    Close: 'Close',
  },
}));

jest.mock('@/lib/components/button', () => ({
  Button: ({ 
    text, 
    textColor, 
    variant, 
    size, 
    pill, 
    onClick, 
    'aria-pressed': ariaPressed, 
    'aria-label': ariaLabel 
  }: any) => (
    <button
      data-testid={`button-${text}`}
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      data-text-color={textColor}
      data-aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'PRIMARY',
    OUTLINE: 'OUTLINE',
  },
}));

jest.mock('@/lib/components/textInput', () => ({
  TextInput: ({ 
    placeholder, 
    inputStyles, 
    value, 
    onChange, 
    'aria-label': ariaLabel 
  }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      style={inputStyles}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  ),
}));

jest.mock('../DropdownMenu', () => ({
  __esModule: true,
  default: ({ 
    id, 
    title, 
    data, 
    onSelect, 
    width, 
    'aria-label': ariaLabel 
  }: any) => (
    <div
      data-testid={`dropdown-${id}`}
      data-title={title}
      data-width={width}
      aria-label={ariaLabel}
    >
      <select
        data-testid={`select-${id}`}
        onChange={(e) => onSelect(e.target.value)}
        aria-label={ariaLabel}
      >
        {data.map((item: any) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe('PluginsFilters Component', () => {
  const mockOnSearch = jest.fn();
  const mockOnFilter = jest.fn();
  const mockOnSort = jest.fn();
  const mockActiveFilters: string[] = [];

  const mockPlugins: Plugin[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: JSON.stringify({ tags: ['machine-learning', 'classification'] }),
      is_stock: false,
      zip_hash: 'testhash',
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-01T00:00:00',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
    },
    {
      gid: 'plugin2',
      version: '1.0.0',
      name: 'Test Plugin 2',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: JSON.stringify({ tags: ['regression', 'data-analysis'] }),
      is_stock: false,
      zip_hash: 'testhash',
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-01T00:00:00',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
    },
    {
      gid: 'plugin3',
      version: '1.0.0',
      name: 'Test Plugin 3',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: JSON.stringify({ tags: ['machine-learning', 'clustering'] }),
      is_stock: false,
      zip_hash: 'testhash',
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-01T00:00:00',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
    },
  ];

  const mockPluginsWithInvalidMeta: Plugin[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: 'invalid-json',
      is_stock: false,
      zip_hash: 'testhash',
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-01T00:00:00',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
    },
  ];

  const mockPluginsWithNoTags: Plugin[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: JSON.stringify({ otherField: 'value' }),
      is_stock: false,
      zip_hash: 'testhash',
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-01T00:00:00',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
    },
  ];

  const defaultProps = {
    onSearch: mockOnSearch,
    onFilter: mockOnFilter,
    onSort: mockOnSort,
    activeFilters: mockActiveFilters,
    plugins: mockPlugins,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all pill filter buttons', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByTestId('button-TEMPLATES')).toBeInTheDocument();
      expect(screen.getByTestId('button-WIDGETS')).toBeInTheDocument();
      expect(screen.getByTestId('button-ALGORITHMS')).toBeInTheDocument();
      expect(screen.getByTestId('button-INPUT BLOCKS')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search Plugins')).toBeInTheDocument();
    });

    it('should render filter and sort dropdowns', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByTestId('dropdown-filter-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-sort-dropdown')).toBeInTheDocument();
    });

    it('should render section headings', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByTestId('icon-MagnifyGlass')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByRole('group', { name: 'Filter by category' })).toBeInTheDocument();
      expect(screen.getByLabelText('Search for plugins')).toBeInTheDocument();
      expect(screen.getByTestId('select-filter-dropdown')).toHaveAttribute('aria-label', 'Filter by tags');
      expect(screen.getByTestId('select-sort-dropdown')).toHaveAttribute('aria-label', 'Sort plugins');
      expect(screen.getByLabelText('Search icon')).toBeInTheDocument();
    });

    it('should have proper button ARIA attributes', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates']} />);
      
      const templatesButton = screen.getByTestId('button-TEMPLATES');
      expect(templatesButton).toHaveAttribute('data-aria-pressed', 'true');
      expect(templatesButton).toHaveAttribute('aria-label', 'Filter by TEMPLATES');
    });

    it('should have proper section ARIA attributes', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-labelledby', 'filter-section-title');
    });
  });

  describe('Pill Filter Functionality', () => {
    it('should call onFilter when pill button is clicked to add filter', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const templatesButton = screen.getByTestId('button-TEMPLATES');
      fireEvent.click(templatesButton);
      
      expect(mockOnFilter).toHaveBeenCalledWith(['templates']);
    });

    it('should call onFilter when pill button is clicked to remove filter', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates']} />);
      
      const templatesButton = screen.getByTestId('button-TEMPLATES');
      fireEvent.click(templatesButton);
      
      expect(mockOnFilter).toHaveBeenCalledWith([]);
    });

    it('should show active state for selected pill filters', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates', 'widgets']} />);
      
      const templatesButton = screen.getByTestId('button-TEMPLATES');
      const widgetsButton = screen.getByTestId('button-WIDGETS');
      
      expect(templatesButton).toHaveAttribute('data-aria-pressed', 'true');
      expect(widgetsButton).toHaveAttribute('data-aria-pressed', 'true');
    });

    it('should show inactive state for unselected pill filters', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates']} />);
      
      const algorithmsButton = screen.getByTestId('button-ALGORITHMS');
      const inputBlocksButton = screen.getByTestId('button-INPUT BLOCKS');
      
      expect(algorithmsButton).toHaveAttribute('data-aria-pressed', 'false');
      expect(inputBlocksButton).toHaveAttribute('data-aria-pressed', 'false');
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when search input changes', async () => {
      const user = userEvent.setup();
      render(<PluginsFilters {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test search');
      
      expect(mockOnSearch).toHaveBeenCalledWith('test search');
    });

    it('should show clear search icon when search query exists', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      expect(screen.getByTestId('icon-Close')).toBeInTheDocument();
    });

    it('should not show clear search icon when search query is empty', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      expect(screen.queryByTestId('icon-Close')).not.toBeInTheDocument();
    });

    it('should clear search when clear icon is clicked', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearIcon = screen.getByTestId('icon-Close');
      fireEvent.click(clearIcon);
      
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Tag Filter Functionality', () => {
    it('should extract and display unique tags from plugins', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      // Should have Select option + 5 unique tags (machine-learning, classification, regression, data-analysis, clustering)
      expect(options).toHaveLength(6);
      expect(options[0]).toHaveTextContent('Select');
      expect(options[1]).toHaveTextContent('machine-learning');
      expect(options[2]).toHaveTextContent('classification');
      expect(options[3]).toHaveTextContent('regression');
      expect(options[4]).toHaveTextContent('data-analysis');
      expect(options[5]).toHaveTextContent('clustering');
    });

    it('should call onFilter when tag is selected', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      fireEvent.change(filterDropdown, { target: { value: 'tag:machine-learning' } });
      
      expect(mockOnFilter).toHaveBeenCalledWith(['tag:machine-learning']);
    });

    it('should remove tag filters when Select option is chosen', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates', 'tag:machine-learning']} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      fireEvent.change(filterDropdown, { target: { value: '' } });
      
      expect(mockOnFilter).toHaveBeenCalledWith(['templates']);
    });

    it('should preserve non-tag filters when tag is selected', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates', 'widgets']} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      fireEvent.change(filterDropdown, { target: { value: 'tag:machine-learning' } });
      
      expect(mockOnFilter).toHaveBeenCalledWith(['templates', 'widgets', 'tag:machine-learning']);
    });

    it('should handle plugins with no meta field', () => {
      const pluginsWithoutMeta = mockPlugins.map(plugin => ({ ...plugin, meta: '' }));
      render(<PluginsFilters {...defaultProps} plugins={pluginsWithoutMeta} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      // Should only have Select option
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle plugins with invalid JSON meta', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PluginsFilters {...defaultProps} plugins={mockPluginsWithInvalidMeta} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      // Should only have Select option due to JSON parse error
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing plugin meta:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle plugins with meta but no tags', () => {
      render(<PluginsFilters {...defaultProps} plugins={mockPluginsWithNoTags} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      // Should only have Select option
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle plugins with empty tags array', () => {
      const pluginsWithEmptyTags = mockPlugins.map(plugin => ({
        ...plugin,
        meta: JSON.stringify({ tags: [] })
      }));
      render(<PluginsFilters {...defaultProps} plugins={pluginsWithEmptyTags} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      // Should only have Select option
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });
  });

  describe('Sort Functionality', () => {
    it('should call onSort when sort option is selected', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const sortDropdown = screen.getByTestId('select-sort-dropdown');
      fireEvent.change(sortDropdown, { target: { value: 'date-asc' } });
      
      expect(mockOnSort).toHaveBeenCalledWith('date-asc');
    });

    it('should display all sort options', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const sortDropdown = screen.getByTestId('select-sort-dropdown');
      const options = sortDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Installed Date (oldest to newest)');
      expect(options[1]).toHaveTextContent('Installed Date (newest to oldest)');
      expect(options[2]).toHaveTextContent('Name (A-Z)');
    });
  });

  describe('Component State Management', () => {
    it('should initialize with empty search query', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveValue('');
    });

    it('should initialize with default filter options', () => {
      render(<PluginsFilters {...defaultProps} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options[0]).toHaveValue('');
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should update filter options when plugins prop changes', () => {
      const { rerender } = render(<PluginsFilters {...defaultProps} plugins={[]} />);
      
      let filterDropdown = screen.getByTestId('select-filter-dropdown');
      let options = filterDropdown.querySelectorAll('option');
      expect(options).toHaveLength(1); // Only Select option
      
      rerender(<PluginsFilters {...defaultProps} plugins={mockPlugins} />);
      
      filterDropdown = screen.getByTestId('select-filter-dropdown');
      options = filterDropdown.querySelectorAll('option');
      expect(options).toHaveLength(6); // Select + 5 unique tags
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty plugins array', () => {
      render(<PluginsFilters {...defaultProps} plugins={[]} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle undefined plugins prop', () => {
      render(<PluginsFilters {...defaultProps} plugins={undefined} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle plugins with null meta', () => {
      const pluginsWithNullMeta = mockPlugins.map(plugin => ({ ...plugin, meta: '' }));
      render(<PluginsFilters {...defaultProps} plugins={pluginsWithNullMeta} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle plugins with empty meta string', () => {
      const pluginsWithEmptyMeta = mockPlugins.map(plugin => ({ ...plugin, meta: '' }));
      render(<PluginsFilters {...defaultProps} plugins={pluginsWithEmptyMeta} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle plugins with meta that is not an object', () => {
      const pluginsWithStringMeta = mockPlugins.map(plugin => ({ 
        ...plugin, 
        meta: JSON.stringify('not-an-object') 
      }));
      render(<PluginsFilters {...defaultProps} plugins={pluginsWithStringMeta} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });

    it('should handle plugins with meta that has non-array tags', () => {
      const pluginsWithNonArrayTags = mockPlugins.map(plugin => ({ 
        ...plugin, 
        meta: JSON.stringify({ tags: 'not-an-array' }) 
      }));
      render(<PluginsFilters {...defaultProps} plugins={pluginsWithNonArrayTags} />);
      
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      const options = filterDropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Select');
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple filter interactions', () => {
      render(<PluginsFilters {...defaultProps} activeFilters={['templates']} />);
      
      // Add tag filter while templates filter is active
      const filterDropdown = screen.getByTestId('select-filter-dropdown');
      fireEvent.change(filterDropdown, { target: { value: 'tag:machine-learning' } });
      expect(mockOnFilter).toHaveBeenCalledWith(['templates', 'tag:machine-learning']);
      
      // Clear mock for next assertion
      mockOnFilter.mockClear();
      
      // Remove tag filter (select "Select" option)
      fireEvent.change(filterDropdown, { target: { value: '' } });
      expect(mockOnFilter).toHaveBeenCalledWith(['templates']);
    });

    it('should handle search and filter combination', async () => {
      const user = userEvent.setup();
      render(<PluginsFilters {...defaultProps} />);
      
      // Search
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      expect(mockOnSearch).toHaveBeenCalledWith('test');
      
      // Add filter
      const templatesButton = screen.getByTestId('button-TEMPLATES');
      fireEvent.click(templatesButton);
      expect(mockOnFilter).toHaveBeenCalledWith(['templates']);
      
      // Clear search
      const clearIcon = screen.getByTestId('icon-Close');
      fireEvent.click(clearIcon);
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });
}); 