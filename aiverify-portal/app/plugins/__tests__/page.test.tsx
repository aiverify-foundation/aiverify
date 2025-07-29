import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PluginsPage from '../page';
import { Plugin } from '@/app/types';

// Mock the getPlugins API function
jest.mock('@/lib/fetchApis/getPlugins', () => ({
  getPlugins: jest.fn(),
}));

// Mock child components
jest.mock('@/app/plugins/components/ActionButtons', () => {
  return function MockActionButtons() {
    return <div data-testid="action-buttons">Action Buttons</div>;
  };
});

jest.mock('../components/PluginList', () => {
  return function MockPluginsList({ plugins }: { plugins: Plugin[] }) {
    return (
      <div data-testid="plugins-list">
        Plugins List - Count: {plugins.length}
      </div>
    );
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: any) => (
    <div data-testid="icon" data-name={name} data-size={size} data-color={color}>
      Icon
    </div>
  ),
  IconName: {
    Plug: 'Plug',
  },
}));

import { getPlugins } from '@/lib/fetchApis/getPlugins';

const mockGetPlugins = getPlugins as jest.MockedFunction<typeof getPlugins>;

describe('PluginsPage Component', () => {
  const mockPlugins: Plugin[] = [
    {
      gid: '1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test Description',
      url: 'https://test.com',
      meta: 'test meta',
      is_stock: false,
      zip_hash: 'hash1',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      gid: '2',
      version: '2.0.0',
      name: 'Test Plugin 2',
      author: 'Test Author 2',
      description: 'Test Description 2',
      url: 'https://test2.com',
      meta: 'test meta 2',
      is_stock: true,
      zip_hash: 'hash2',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful API Response', () => {
    it('renders page with plugins when API returns success with array data', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockPlugins,
      });

      render(await PluginsPage());

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Plugin Manager');
      expect(screen.getByText('Manage plugins, their templates and algorithms.')).toBeInTheDocument();
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-list')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-list')).toHaveTextContent('Plugins List - Count: 2');
    });

    it('renders page with plugins when API returns success with object data', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: { plugin1: mockPlugins[0], plugin2: mockPlugins[1] },
      });

      render(await PluginsPage());

      expect(screen.getByTestId('plugins-list')).toHaveTextContent('Plugins List - Count: 2');
    });

    it('renders with empty plugins when API returns success with empty data', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: [],
      });

      render(await PluginsPage());

      expect(screen.getByTestId('plugins-list')).toHaveTextContent('Plugins List - Count: 0');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('API Error Responses', () => {
    it('displays error message when API returns error status', async () => {
      const errorMessage = 'Failed to fetch plugins';
      mockGetPlugins.mockResolvedValue({
        status: 'error',
        code: 500,
        message: errorMessage,
      });

      render(await PluginsPage());

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveClass('border-red-400', 'bg-red-100', 'text-red-700');
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByTestId('plugins-list')).not.toBeInTheDocument();
    });

    it('displays error message when API returns error with message property', async () => {
      const errorMessage = 'Network error occurred';
      mockGetPlugins.mockResolvedValue({
        message: errorMessage,
      } as any);

      render(await PluginsPage());

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('handles API rejection gracefully', async () => {
      mockGetPlugins.mockRejectedValue(new Error('Network failure'));

      render(await PluginsPage());

      // Should render error message when API fails
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText('Failed to load plugins')).toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    beforeEach(async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockPlugins,
      });
    });

    it('renders the plug icon with correct properties', async () => {
      render(await PluginsPage());

      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('data-name', 'Plug');
      expect(icon).toHaveAttribute('data-size', '40');
      expect(icon).toHaveAttribute('data-color', '#FFFFFF');
    });

    it('applies correct CSS classes to main container', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockPlugins,
      });

      render(await PluginsPage());

      const mainContainer = document.querySelector('.p-6');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('p-6');
    });

    it('has proper heading structure', async () => {
      render(await PluginsPage());

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Plugin Manager');
      expect(h1).toHaveClass('text-2xl', 'font-bold', 'text-white');

      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3).toHaveTextContent('Manage plugins, their templates and algorithms.');
      expect(h3).toHaveClass('text-white');
    });

    it('renders action buttons and plugins list', async () => {
      render(await PluginsPage());

      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-list')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockPlugins,
      });

      render(await PluginsPage());

      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveProperty('tagName', 'H1');
      expect(headings[1]).toHaveProperty('tagName', 'H3');
    });

    it('error alert has proper accessibility attributes', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'error',
        code: 500,
        message: 'Test error',
      });

      render(await PluginsPage());

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('relative');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined data gracefully', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: undefined,
      } as any);

      render(await PluginsPage());

      expect(screen.getByTestId('plugins-list')).toHaveTextContent('Plugins List - Count: 0');
    });

    it('handles null data gracefully', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        code: 200,
        data: null,
      } as any);

      render(await PluginsPage());

      expect(screen.getByTestId('plugins-list')).toHaveTextContent('Plugins List - Count: 0');
    });
  });
}); 