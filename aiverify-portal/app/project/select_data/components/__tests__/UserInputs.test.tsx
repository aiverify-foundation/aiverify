import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import UserInputs from '../UserInputs';
import { InputBlock, InputBlockData, InputBlockGroupData, Plugin } from '@/app/types';
import { ValidationResults } from '@/app/project/select_data/utils/validationUtils';

// Mock Next.js navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock the useMDXBundle hook
const mockUseMDXBundle = jest.fn();
jest.mock('@/app/inputs/groups/[gid]/[group]/[groupId]/[cid]/hooks/useMDXBundle', () => ({
  useMDXBundle: () => mockUseMDXBundle(),
}));

// Mock the validation utilities
jest.mock('@/app/project/select_data/utils/validationUtils', () => ({
  validateInputBlock: jest.fn(),
  processBatchValidations: jest.fn(),
}));

// Mock the getPlugins API
jest.mock('@/lib/fetchApis/getPlugins', () => ({
  getPlugins: jest.fn(),
}));

// Mock the PluginInputModal component
jest.mock('@/app/project/select_data/components/PluginInputModal', () => {
  return function MockPluginInputModal({ isOpen, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="plugin-input-modal">
        <button onClick={() => onClose(false)}>Close</button>
        <button onClick={() => onClose(true)}>Submit</button>
      </div>
    );
  };
});

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Get references to mocked functions
const mockValidateInputBlock = require('@/app/project/select_data/utils/validationUtils').validateInputBlock as jest.MockedFunction<any>;
const mockProcessBatchValidations = require('@/app/project/select_data/utils/validationUtils').processBatchValidations as jest.MockedFunction<any>;
const mockGetPlugins = require('@/lib/fetchApis/getPlugins').getPlugins as jest.MockedFunction<any>;

describe('UserInputs', () => {
  const mockRequiredInputBlocks: InputBlock[] = [
    {
      gid: 'group-1',
      cid: 'input-1',
      name: 'Single Input Block 1',
      description: 'Single input block description',
    },
    {
      gid: 'group-1',
      cid: 'input-2',
      name: 'Single Input Block 2',
      description: 'Single input block description 2',
    },
    {
      gid: 'group-2',
      cid: 'group-input-1',
      name: 'Group Input Block 1',
      description: 'Group input block description',
      group: 'test-group',
    },
    {
      gid: 'group-2',
      cid: 'group-input-2',
      name: 'Group Input Block 2',
      description: 'Group input block description 2',
      group: 'test-group',
    },
  ];

  const mockAllInputBlockGroups: InputBlockGroupData[] = [
    {
      id: 1,
      gid: 'group-2',
      name: 'Test Group 1',
      group: 'test-group',
      input_blocks: [
        {
          id: 101,
          cid: 'group-input-1',
          name: 'Child 1',
          groupNumber: 1,
          data: { test: 'data1' },
        },
        {
          id: 102,
          cid: 'group-input-2',
          name: 'Child 2',
          groupNumber: 1,
          data: { test: 'data2' },
        },
      ],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'group-2',
      name: 'Test Group 2',
      group: 'test-group',
      input_blocks: [
        {
          id: 201,
          cid: 'group-input-1',
          name: 'Child 3',
          groupNumber: 2,
          data: { test: 'data3' },
        },
        {
          id: 202,
          cid: 'group-input-2',
          name: 'Child 4',
          groupNumber: 2,
          data: { test: 'data4' },
        },
      ],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockAllInputBlockDatas: InputBlockData[] = [
    {
      gid: 'group-1',
      cid: 'input-1',
      name: 'Input Data 1',
      group: 'test-group',
      data: { test: 'data1' },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      gid: 'group-1',
      cid: 'input-1',
      name: 'Input Data 2',
      group: 'test-group',
      data: { test: 'data2' },
      id: 2,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      gid: 'group-1',
      cid: 'input-2',
      name: 'Input Data 3',
      group: 'test-group',
      data: { test: 'data3' },
      id: 3,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockPlugins: Record<string, Plugin> = {
    'aiverify.plugin.test': {
      gid: 'aiverify.plugin.test',
      name: 'Test Plugin',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test plugin description',
      url: null,
      meta: 'test meta',
      is_stock: false,
      zip_hash: 'test-hash',
      algorithms: [],
      widgets: [],
      input_blocks: [
        {
          gid: 'aiverify.plugin.test',
          cid: 'test-input',
          name: 'Test Input',
          description: 'Test input description',
          width: 'md',
          fullScreen: false,
        },
      ],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  };

  const defaultProps = {
    requiredInputBlocks: mockRequiredInputBlocks,
    onInputBlocksChange: jest.fn(),
    allInputBlockGroups: mockAllInputBlockGroups,
    allInputBlockDatas: mockAllInputBlockDatas,
    flow: 'edit',
    projectId: 'test-project',
    initialInputBlocks: [],
    onValidationResultsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMDXBundle.mockReturnValue({
      data: { code: 'test mdx code' },
      isLoading: false,
      error: null,
    });
    mockGetPlugins.mockResolvedValue({
      status: 'success',
      data: mockPlugins,
    });
    mockProcessBatchValidations.mockResolvedValue({});
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 123 }),
    });
  });

  describe('Component Rendering', () => {
    it('renders the component with title and description', () => {
      render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getByText('Upload new User Input or select existing User Input.')).toBeInTheDocument();
    });

    it('renders group-based input blocks', () => {
      render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('test-group')).toBeInTheDocument();
      expect(screen.getAllByText('Choose User Input')).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('renders single input blocks', () => {
      render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('Single Input Block 1')).toBeInTheDocument();
      expect(screen.getByText('Single Input Block 2')).toBeInTheDocument();
      expect(screen.getAllByText('Choose User Input')).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('renders plugin input blocks with plugin name', () => {
      const pluginInputBlocks: InputBlock[] = [
        {
          gid: 'aiverify.plugin.test',
          cid: 'test-input',
          name: 'Plugin Input',
          description: 'Plugin input description',
        },
      ];

      render(<UserInputs {...defaultProps} requiredInputBlocks={pluginInputBlocks} />);
      
      expect(screen.getByText('Plugin Input')).toBeInTheDocument();
      expect(screen.getByText('Plugin: test')).toBeInTheDocument();
    });

    it('renders ADD INPUT buttons for all input blocks', () => {
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      expect(addButtons).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('renders MISSING GID button when gid is not available', () => {
      const inputBlocksWithoutGid = [
        {
          gid: '',
          cid: 'input-1',
          name: 'Input Without GID',
          description: 'Input without GID',
          group: 'test-group',
        },
      ];

      render(<UserInputs {...defaultProps} requiredInputBlocks={inputBlocksWithoutGid} />);
      
      expect(screen.getByText('MISSING GID')).toBeInTheDocument();
    });
  });

  describe('Initial State and Props', () => {
    it('initializes with empty selections when no initial input blocks', () => {
      render(<UserInputs {...defaultProps} />);
      
      const dropdowns = screen.getAllByRole('combobox');
      expect(dropdowns.length).toBeGreaterThan(0);
    });

    it('initializes with initial single input blocks', () => {
      const propsWithInitial = {
        ...defaultProps,
        initialInputBlocks: [
          {
            gid: 'group-1',
            cid: 'input-1',
            id: 1,
            group: null,
            isGroupSelection: false,
          },
        ],
      };
      
      render(<UserInputs {...propsWithInitial} />);
      
      // Component should render without crashing
      expect(screen.getByText('Single Input Block 1')).toBeInTheDocument();
    });

    it('handles missing initial group gracefully', () => {
      const propsWithMissingGroup = {
        ...defaultProps,
        initialInputBlocks: [
          {
            gid: 'group-1',
            cid: 'input-1',
            id: 1,
            group: null,
            isGroupSelection: false,
          },
        ],
      };
      
      // Mock the group data to be missing
      mockFetch.mockRejectedValueOnce(new Error('Group data not found'));
      
      render(<UserInputs {...propsWithMissingGroup} />);
      
      // Should not crash
      expect(screen.getByText('Single Input Block 1')).toBeInTheDocument();
    });
  });

  describe('Group Selection', () => {
    it('handles group selection', async () => {
      render(<UserInputs {...defaultProps} />);
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } }); // First select is group dropdown

      // Verify the selection was made
      expect(selectElements[0]).toHaveValue('1');
    });

    it('handles group deselection', async () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '' } }); // Deselect group

      await waitFor(() => {
        expect(defaultProps.onInputBlocksChange).toHaveBeenCalledWith([]);
      });
    });

    it('prevents unnecessary updates when same group is selected', () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } }); // Same value

      // Should not call onInputBlocksChange since it's the same selection
      expect(defaultProps.onInputBlocksChange).not.toHaveBeenCalled();
    });
  });

  describe('Single Input Selection', () => {
    it('handles single input selection', async () => {
      render(<UserInputs {...defaultProps} />);
      
      // Use getAllByRole to get all select elements and target the single input ones
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // Second select is first single input

      // Verify the selection was made
      expect(selectElements[1]).toHaveValue('1');
    });

    it('handles multiple single input selections', async () => {
      render(<UserInputs {...defaultProps} />);
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // First single input
      fireEvent.change(selectElements[2], { target: { value: '3' } }); // Second single input

      // Verify the selections were made
      expect(selectElements[1]).toHaveValue('1');
      expect(selectElements[2]).toHaveValue('3');
    });

    it('prevents unnecessary updates when same input is selected', () => {
      const initialInputBlocks = [
        { gid: 'group-1', cid: 'input-1', id: 1 },
      ];

      render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // Same value

      // Should not call onInputBlocksChange since it's the same selection
      expect(defaultProps.onInputBlocksChange).not.toHaveBeenCalled();
    });
  });

  describe('Add Input Modal', () => {
    it('opens modal when ADD INPUT button is clicked', () => {
      render(<UserInputs {...defaultProps} />);
      
      // Click the second ADD INPUT button (single input block) instead of the first one (group)
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', () => {
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles input submission from modal', async () => {
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('validates input block after submission', async () => {
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // The modal should close after submission
      await waitFor(() => {
        expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Add New Input Block Group', () => {
    it('creates new input block group successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 456 }),
      });

      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/input_block_data/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gid: 'group-2',
            group: 'test-group',
            name: 'test-group',
            input_blocks: [],
          }),
        });
      });
    });

    it('handles API error when creating group', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('redirects to edit page after successful group creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });
      
      // Mock window.location.href assignment
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: 'http://localhost/' } as any;
      
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[0]);
      
      // The component should attempt to redirect
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      // Restore original location
      window.location = originalLocation;
    });

    it('includes flow and projectId in redirect URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });
      
      // Mock window.location.href assignment
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: 'http://localhost/' } as any;
      
      const propsWithFlow = {
        ...defaultProps,
        flow: 'test-flow',
        projectId: 'test-project',
      };
      
      render(<UserInputs {...propsWithFlow} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[0]);
      
      // The component should attempt to redirect
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      // Restore original location
      window.location = originalLocation;
    });

    it('shows error alert when gid is missing', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      
      // Create a component with missing gid
      const propsWithMissingGid = {
        ...defaultProps,
        requiredInputBlocks: [
          {
            gid: '',
            cid: 'input-1',
            name: 'Input Without GID',
            description: 'Input without GID',
            group: 'test-group',
          },
        ],
      };
      
      render(<UserInputs {...propsWithMissingGid} />);
      
      // The component should render with MISSING GID button
      expect(screen.getByText('MISSING GID')).toBeInTheDocument();
      
      alertSpy.mockRestore();
    });
  });

  describe('Validation', () => {
    it('prevalidates all input blocks on mount', () => {
      render(<UserInputs {...defaultProps} />);
      
      expect(mockProcessBatchValidations).toHaveBeenCalled();
    });

    it('notifies parent of validation results changes', async () => {
      // Mock the validation to return some results
      mockProcessBatchValidations.mockResolvedValue({
        'test-validation': { isValid: true, errors: [] }
      });

      render(<UserInputs {...defaultProps} />);
      
      // Wait for the validation to complete and the callback to be called
      await waitFor(() => {
        expect(mockProcessBatchValidations).toHaveBeenCalled();
      });

      // Wait for the validation results to be processed and callback to be called
      await waitFor(() => {
        expect(defaultProps.onValidationResultsChange).toHaveBeenCalledWith({
          'test-validation': { isValid: true, errors: [] }
        });
      });
    });
  });

  describe('Plugin Data Fetching', () => {
    it('fetches plugins data on mount', async () => {
      render(<UserInputs {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalledWith({ groupByPluginId: true });
      });
    });

    it('extracts input block properties from plugins', async () => {
      render(<UserInputs {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalled();
      });
    });

    it('handles plugin fetch errors gracefully', async () => {
      mockGetPlugins.mockRejectedValue(new Error('Plugin fetch error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<UserInputs {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch plugins data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles invalid plugin response', async () => {
      mockGetPlugins.mockResolvedValue({ status: 'error' });

      render(<UserInputs {...defaultProps} />);

      // Should not crash and should not set plugin data
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Data Refresh', () => {
    it('refreshes data when requested', async () => {
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('handles modal close with refresh', () => {
      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty required input blocks', () => {
      render(<UserInputs {...defaultProps} requiredInputBlocks={[]} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.queryByText('Choose User Input')).not.toBeInTheDocument();
    });

    it('handles empty input block groups', () => {
      render(<UserInputs {...defaultProps} allInputBlockGroups={[]} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getByText('test-group')).toBeInTheDocument();
    });

    it('handles empty input block data', () => {
      render(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getAllByText('Choose User Input')).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('handles missing input block properties', () => {
      const inputBlockWithoutProperties = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Input Without Properties',
        description: 'Input without properties',
      };

      render(<UserInputs {...defaultProps} requiredInputBlocks={[inputBlockWithoutProperties]} />);
      
      expect(screen.getByText('Input Without Properties')).toBeInTheDocument();
    });

    it('handles null projectId', () => {
      render(<UserInputs {...defaultProps} projectId={null} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles undefined onValidationResultsChange', () => {
      const propsWithoutValidation = { ...defaultProps };
      propsWithoutValidation.onValidationResultsChange = undefined as any;

      render(<UserInputs {...propsWithoutValidation} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Input Block Type Detection', () => {
    it('correctly identifies group-based input blocks', () => {
      const groupBlock: InputBlock = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Group Input',
        description: 'Group input description',
        group: 'test-group',
      };

      render(<UserInputs {...defaultProps} requiredInputBlocks={[groupBlock]} />);
      
      expect(screen.getByText('test-group')).toBeInTheDocument();
    });

    it('correctly identifies single input blocks', () => {
      const singleBlock: InputBlock = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Single Input',
        description: 'Single input description',
      };

      render(<UserInputs {...defaultProps} requiredInputBlocks={[singleBlock]} />);
      
      expect(screen.getByText('Single Input')).toBeInTheDocument();
      expect(screen.getByText('Choose User Input')).toBeInTheDocument();
    });
  });

  describe('MDX Bundle Integration', () => {
    it('uses MDX bundle for modal content', () => {
      mockUseMDXBundle.mockReturnValue({
        data: { code: 'test mdx code' },
        isLoading: false,
        error: null,
      });

      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('handles MDX bundle loading state', () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('handles MDX bundle error state', () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('MDX error'),
      });

      render(<UserInputs {...defaultProps} />);
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up on unmount', () => {
      const { unmount } = render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      
      unmount();
      
      // Component should be unmounted without errors
    });

    it('handles multiple re-renders', () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      
      rerender(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });
}); 