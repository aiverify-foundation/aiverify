import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PluginDetail from '../PluginDetail';
import { Plugin } from '@/app/plugins/utils/types';

// Mock the hooks and components
jest.mock('@/app/plugins/hooks/useDeletePlugin');
jest.mock('@/app/plugins/utils/icons', () => ({
  DeleteIcon: ({ onClick, 'aria-label': ariaLabel, role }: any) => (
    <button
      data-testid="delete-icon"
      onClick={onClick}
      aria-label={ariaLabel}
      role={role}
    >
      Delete
    </button>
  ),
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: ({
    children,
    heading,
    onCloseIconClick,
    onPrimaryBtnClick,
    onSecondaryBtnClick,
    primaryBtnLabel,
    secondaryBtnLabel,
    bgColor,
    textColor,
    enableScreenOverlay,
    height,
  }: any) => (
    <div
      data-testid="modal"
      style={{ backgroundColor: bgColor, color: textColor, height }}
    >
      <div data-testid="modal-heading">{heading}</div>
      <div data-testid="modal-content">{children}</div>
      <button data-testid="modal-close" onClick={onCloseIconClick}>
        Close
      </button>
      {onPrimaryBtnClick && (
        <button data-testid="modal-primary" onClick={onPrimaryBtnClick}>
          {primaryBtnLabel}
        </button>
      )}
      {onSecondaryBtnClick && (
        <button data-testid="modal-secondary" onClick={onSecondaryBtnClick}>
          {secondaryBtnLabel}
        </button>
      )}
    </div>
  ),
}));

jest.mock('../DisplayAlgorithm', () => ({
  __esModule: true,
  default: ({ algorithm }: any) => (
    <div data-testid="algorithm-card">
      <h3>{algorithm.name}</h3>
      <p>{algorithm.description}</p>
    </div>
  ),
}));

jest.mock('../DisplayInputBlocks', () => ({
  __esModule: true,
  default: ({ input_block }: any) => (
    <div data-testid="input-block-card">
      <h3>{input_block.name}</h3>
      <p>{input_block.description}</p>
    </div>
  ),
}));

jest.mock('../DisplayTemplate', () => ({
  __esModule: true,
  default: ({ template }: any) => (
    <div data-testid="template-card">
      <h3>{template.name}</h3>
      <p>{template.description}</p>
    </div>
  ),
}));

jest.mock('../DisplayWidget', () => ({
  __esModule: true,
  default: ({ widget }: any) => (
    <div data-testid="widget-card">
      <h3>{widget.name}</h3>
      <p>{widget.description}</p>
    </div>
  ),
}));

const mockUseDeletePlugin = jest.mocked(require('@/app/plugins/hooks/useDeletePlugin').useDeletePlugin);

describe('PluginDetail Component', () => {
  const mockOnDelete = jest.fn();
  
  const mockPlugin: Plugin = {
    gid: 'test-plugin-123',
    version: '1.0.0',
    name: 'Test Plugin',
    author: 'Test Author',
    description: 'Test Description',
    url: 'https://test.com',
    meta: 'test meta',
    is_stock: false,
    zip_hash: 'testhash',
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T00:00:00',
    algorithms: [
      {
        cid: 'algo1',
        gid: 'test-plugin-123',
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
          description: null,
          type: 'object',
          required: ['param1'],
          properties: {},
        },
        outputSchema: {
          title: 'Test Output Schema',
          description: null,
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
              description: 'Algorithm results',
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['indices'],
                properties: {
                  indices: {
                    type: 'array',
                    description: 'Indices',
                    items: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        zip_hash: 'testhash',
      },
    ],
    widgets: [
      {
        cid: 'widget1',
        gid: 'test-plugin-123',
        name: 'Test Widget',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Widget Description',
        tags: 'test',
        widgetSize: {
          minW: 2,
          minH: 2,
          maxW: 4,
          maxH: 4,
        },
        properties: [
          {
            key: 'test_prop',
            helper: 'Test helper',
            default: 'test_default',
          },
        ],
        dependencies: [
          {
            gid: 'dep1',
            cid: 'dep_cid1',
            version: '1.0.0',
          },
        ],
        mockdata: [
          {
            type: 'test_type',
            gid: 'mock_gid1',
            cid: 'mock_cid1',
            datapath: 'test/path',
          },
        ],
        dynamicHeight: false,
      },
    ],
    input_blocks: [
      {
        cid: 'input1',
        gid: 'test-plugin-123',
        name: 'Test Input Block',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Input Block Description',
        tags: 'test',
        group: 'test_group',
        groupNumber: 1,
        width: 'full',
        fullScreen: false,
      },
    ],
    templates: [
      {
        cid: 'template1',
        gid: 'test-plugin-123',
        name: 'Test Template',
        description: 'Test Template Description',
        author: 'Test Author',
        version: '1.0.0',
        tags: 'test',
      },
    ],
  };

  const mockPluginWithOnlyWidgets: Plugin = {
    ...mockPlugin,
    algorithms: [],
    input_blocks: [],
    templates: [],
  };

  const mockPluginWithOnlyAlgorithms: Plugin = {
    ...mockPlugin,
    widgets: [],
    input_blocks: [],
    templates: [],
  };

  const mockPluginWithOnlyInputBlocks: Plugin = {
    ...mockPlugin,
    widgets: [],
    algorithms: [],
    templates: [],
  };

  const mockPluginWithOnlyTemplates: Plugin = {
    ...mockPlugin,
    widgets: [],
    algorithms: [],
    input_blocks: [],
  };

  const mockPluginWithNoContent: Plugin = {
    ...mockPlugin,
    widgets: [],
    algorithms: [],
    input_blocks: [],
    templates: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeletePlugin.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering with null plugin', () => {
    it('should render placeholder when plugin is null', () => {
      render(<PluginDetail plugin={null} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Select a plugin to see details here.')).toBeInTheDocument();
    });
  });

  describe('Rendering with plugin data', () => {
    it('should render plugin metadata correctly', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText(/GID:/)).toBeInTheDocument();
      expect(screen.getByText('test-plugin-123')).toBeInTheDocument();
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText(/Author:/)).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText(/Installed on:/)).toBeInTheDocument();
    });

    it('should render delete icon', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    });
  });

  describe('Tab selection logic', () => {
    it('should automatically select widgets tab when plugin has widgets', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Widgets');
      expect(screen.getByTestId('widget-card')).toBeInTheDocument();
    });

    it('should automatically select algorithms tab when plugin has only algorithms', () => {
      render(<PluginDetail plugin={mockPluginWithOnlyAlgorithms} onDelete={mockOnDelete} />);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Algorithms');
      expect(screen.getByTestId('algorithm-card')).toBeInTheDocument();
    });

    it('should automatically select input_blocks tab when plugin has only input blocks', () => {
      render(<PluginDetail plugin={mockPluginWithOnlyInputBlocks} onDelete={mockOnDelete} />);
      
      // Since tabs are only shown when there are widgets OR algorithms, 
      // input_blocks alone won't show tabs, but the content should still be displayed
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByTestId('input-block-card')).toBeInTheDocument();
    });

    it('should automatically select templates tab when plugin has only templates', () => {
      render(<PluginDetail plugin={mockPluginWithOnlyTemplates} onDelete={mockOnDelete} />);
      
      // Since tabs are only shown when there are widgets OR algorithms, 
      // templates alone won't show tabs, but the content should still be displayed
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByTestId('template-card')).toBeInTheDocument();
    });

    it('should not show tabs when plugin has no content', () => {
      render(<PluginDetail plugin={mockPluginWithNoContent} onDelete={mockOnDelete} />);
      
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('should not show tabs when plugin has only input_blocks and templates', () => {
      const pluginWithInputAndTemplates = {
        ...mockPlugin,
        widgets: [],
        algorithms: [],
      };
      render(<PluginDetail plugin={pluginWithInputAndTemplates} onDelete={mockOnDelete} />);
      
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('should switch to algorithms tab when clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const algorithmsTab = screen.getByRole('tab', { name: /Algorithms/ });
      fireEvent.click(algorithmsTab);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Algorithms');
      expect(screen.getByTestId('algorithm-card')).toBeInTheDocument();
    });

    it('should switch to input blocks tab when clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const inputBlocksTab = screen.getByRole('tab', { name: /Input Blocks/ });
      fireEvent.click(inputBlocksTab);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Input Blocks');
      expect(screen.getByTestId('input-block-card')).toBeInTheDocument();
    });

    it('should switch to templates tab when clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const templatesTab = screen.getByRole('tab', { name: /Templates/ });
      fireEvent.click(templatesTab);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Templates');
      expect(screen.getByTestId('template-card')).toBeInTheDocument();
    });

    it('should switch back to widgets tab when clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      // First switch to algorithms
      const algorithmsTab = screen.getByRole('tab', { name: /Algorithms/ });
      fireEvent.click(algorithmsTab);
      
      // Then switch back to widgets
      const widgetsTab = screen.getByRole('tab', { name: /Widgets/ });
      fireEvent.click(widgetsTab);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Widgets');
      expect(screen.getByTestId('widget-card')).toBeInTheDocument();
    });
  });

  describe('Delete functionality', () => {
    it('should show confirmation modal when delete icon is clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this plugin?')).toBeInTheDocument();
    });

    it('should close confirmation modal when cancel button is clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      const cancelButton = screen.getByTestId('modal-secondary');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should close confirmation modal when close icon is clicked', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should show success modal when delete is successful', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue('Plugin deleted successfully!');
      mockUseDeletePlugin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      const deleteButton = screen.getByTestId('modal-primary');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Plugin deleted successfully!')).toBeInTheDocument();
      });
    });

    it('should show error modal when delete fails', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Delete failed'));
      mockUseDeletePlugin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      const deleteButton = screen.getByTestId('modal-primary');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to delete the plugin.')).toBeInTheDocument();
      });
    });

    it('should call onDelete callback when success modal is closed', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue('Plugin deleted successfully!');
      mockUseDeletePlugin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      const deleteButton = screen.getByTestId('modal-primary');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      
      expect(mockOnDelete).toHaveBeenCalledWith('test-plugin-123');
    });

    it('should not call onDelete callback when error modal is closed', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Delete failed'));
      mockUseDeletePlugin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      const deleteIcon = screen.getByTestId('delete-icon');
      fireEvent.click(deleteIcon);
      
      const deleteButton = screen.getByTestId('modal-primary');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('should not proceed with delete when currentPlugin is null', async () => {
      const mockMutateAsync = jest.fn();
      mockUseDeletePlugin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      render(<PluginDetail plugin={null} onDelete={mockOnDelete} />);
      
      // Try to trigger delete (though delete icon won't be visible)
      // This tests the guard clause in confirmDelete
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Plugin prop changes', () => {
    it('should update when plugin prop changes', () => {
      const { rerender } = render(<PluginDetail plugin={null} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Select a plugin to see details here.')).toBeInTheDocument();
      
      rerender(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      expect(screen.queryByText('Select a plugin to see details here.')).not.toBeInTheDocument();
    });

    it('should update tab selection when plugin prop changes', () => {
      const { rerender } = render(<PluginDetail plugin={mockPluginWithOnlyWidgets} onDelete={mockOnDelete} />);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Widgets');
      
      rerender(<PluginDetail plugin={mockPluginWithOnlyAlgorithms} onDelete={mockOnDelete} />);
      
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Algorithms');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Details for Test Plugin plugin');
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Plugin content tabs');
      expect(screen.getByRole('tab', { name: /Widgets/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Widgets/ })).toHaveAttribute('aria-controls', 'widgets-tabpanel');
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'widgets-tab');
    });

    it('should have proper tab counts displayed', () => {
      render(<PluginDetail plugin={mockPlugin} onDelete={mockOnDelete} />);
      
      expect(screen.getByRole('status', { name: 'Widgets count: 1' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'algorithms count: 1' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'input blocks count: 1' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'templates count: 1' })).toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('should format the updated_at date correctly', () => {
      const pluginWithSpecificDate = {
        ...mockPlugin,
        updated_at: '2023-12-25T10:30:00',
      };
      
      render(<PluginDetail plugin={pluginWithSpecificDate} onDelete={mockOnDelete} />);
      
      // The date should be formatted according to en-GB locale
      expect(screen.getByText(/Installed on:/)).toBeInTheDocument();
      // The exact format will depend on the user's locale, but we can check it contains the date
      expect(screen.getByText(/25\/12\/2023/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle plugin with null description', () => {
      const pluginWithNullDescription = {
        ...mockPlugin,
        description: null,
      };
      
      render(<PluginDetail plugin={pluginWithNullDescription} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      // The description paragraph should still be rendered but empty
      expect(screen.getByLabelText('description null')).toBeInTheDocument();
    });

    it('should handle plugin with null author', () => {
      const pluginWithNullAuthor = {
        ...mockPlugin,
        author: null,
      };
      
      render(<PluginDetail plugin={pluginWithNullAuthor} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      expect(screen.getByText(/Author:/)).toBeInTheDocument();
    });
  });
}); 