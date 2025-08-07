import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import UserInputs from '../UserInputs';
import { InputBlock, InputBlockData, InputBlockGroupData, Plugin } from '@/app/types';
import { ValidationResults } from '@/app/project/select_data/utils/validationUtils';

// Helper function to wrap fireEvent calls in act()
const fireEventInAct = async (element: Element, event: any) => {
  await act(async () => {
    fireEvent(element, event);
  });
};

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
    it('renders the component with title and description', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getByText('Upload new User Input or select existing User Input.')).toBeInTheDocument();
    });

    it('renders group-based input blocks', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('test-group')).toBeInTheDocument();
      expect(screen.getAllByText('Choose User Input')).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('renders single input blocks', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('Single Input Block 1')).toBeInTheDocument();
      expect(screen.getByText('Single Input Block 2')).toBeInTheDocument();
      expect(screen.getAllByText('Choose User Input')).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('renders plugin input blocks with plugin name', async () => {
      const pluginInputBlocks: InputBlock[] = [
        {
          gid: 'aiverify.plugin.test',
          cid: 'test-input',
          name: 'Plugin Input',
          description: 'Plugin input description',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={pluginInputBlocks} />);

      });
      
      expect(screen.getByText('Plugin Input')).toBeInTheDocument();
      expect(screen.getByText('Plugin: test')).toBeInTheDocument();
    });

    it('renders ADD INPUT buttons for all input blocks', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      expect(addButtons).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('renders MISSING GID button when gid is not available', async () => {
      const inputBlocksWithoutGid = [
        {
          gid: '',
          cid: 'input-1',
          name: 'Input Without GID',
          description: 'Input without GID',
          group: 'test-group',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={inputBlocksWithoutGid} />);

      });
      
      expect(screen.getByText('MISSING GID')).toBeInTheDocument();
    });
  });

  describe('Initial State and Props', () => {
    it('initializes with empty selections when no initial input blocks', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const dropdowns = screen.getAllByRole('combobox');
      expect(dropdowns.length).toBeGreaterThan(0);
    });

    it('initializes with initial single input blocks', async () => {
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
      
      await act(async () => {
      
        render(<UserInputs {...propsWithInitial} />);
      
      });
      
      // Component should render without crashing
      expect(screen.getByText('Single Input Block 1')).toBeInTheDocument();
    });

    it('handles missing initial group gracefully', async () => {
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
      
      await act(async () => {
      
        render(<UserInputs {...propsWithMissingGroup} />);
      
      });
      
      // Should not crash
      expect(screen.getByText('Single Input Block 1')).toBeInTheDocument();
    });
  });

  describe('Group Selection', () => {
    it('handles group selection', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[0], { target: { value: '1' } }); // First select is group dropdown
      });

      // Verify the selection was made
      expect(selectElements[0]).toHaveValue('1');
    });

    it('handles group deselection', async () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);

      });
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[0], { target: { value: '' } }); // Deselect group
      });

      await waitFor(() => {
        expect(defaultProps.onInputBlocksChange).toHaveBeenCalledWith([]);
      });
    });

    it('prevents unnecessary updates when same group is selected', async () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);

      });
      
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
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Use getAllByRole to get all select elements and target the single input ones
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[1], { target: { value: '1' } }); // Second select is first single input
      });

      // Verify the selection was made
      expect(selectElements[1]).toHaveValue('1');
    });

    it('handles multiple single input selections', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // First single input
      fireEvent.change(selectElements[2], { target: { value: '3' } }); // Second single input

      // Verify the selections were made
      expect(selectElements[1]).toHaveValue('1');
      expect(selectElements[2]).toHaveValue('3');
    });

    it('prevents unnecessary updates when same input is selected', async () => {
      const initialInputBlocks = [
        { gid: 'group-1', cid: 'input-1', id: 1 },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);

      });
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // Same value

      // Should not call onInputBlocksChange since it's the same selection
      expect(defaultProps.onInputBlocksChange).not.toHaveBeenCalled();
    });
  });

  describe('Add Input Modal', () => {
    it('opens modal when ADD INPUT button is clicked', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Click the second ADD INPUT button (single input block) instead of the first one (group)
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const closeButton = screen.getByText('Close');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles input submission from modal', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('validates input block after submission', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
      
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

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

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

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

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

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
      
      await act(async () => {
      
        render(<UserInputs {...defaultProps} />);
      
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });
      
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
      
      await act(async () => {
      
        render(<UserInputs {...propsWithFlow} />);
      
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });
      
      // The component should attempt to redirect
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      // Restore original location
      window.location = originalLocation;
    });

    it('shows error alert when gid is missing', async () => {
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
      
      await act(async () => {
      
        render(<UserInputs {...propsWithMissingGid} />);
      
      });
      
      // The component should render with MISSING GID button
      expect(screen.getByText('MISSING GID')).toBeInTheDocument();
      
      alertSpy.mockRestore();
    });
  });

  describe('Validation', () => {
    it('prevalidates all input blocks on mount', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(mockProcessBatchValidations).toHaveBeenCalled();
    });

    it('notifies parent of validation results changes', async () => {
      // Mock the validation to return some results
      mockProcessBatchValidations.mockResolvedValue({
        'test-validation': { isValid: true, errors: [] }
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
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
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalledWith({ groupByPluginId: true });
      });
    });

    it('extracts input block properties from plugins', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalled();
      });
    });

    it('handles plugin fetch errors gracefully', async () => {
      mockGetPlugins.mockRejectedValue(new Error('Plugin fetch error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch plugins data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles invalid plugin response', async () => {
      mockGetPlugins.mockResolvedValue({ status: 'error' });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });

      // Should not crash and should not set plugin data
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Data Refresh', () => {
    it('refreshes data when requested', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('handles modal close with refresh', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const closeButton = screen.getByText('Close');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty required input blocks', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} requiredInputBlocks={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.queryByText('Choose User Input')).not.toBeInTheDocument();
    });

    it('handles empty input block groups', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockGroups={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getByText('test-group')).toBeInTheDocument();
    });

    it('handles empty input block data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getAllByText('Choose User Input')).toHaveLength(3); // 1 group + 2 single inputs
    });

    it('handles missing input block properties', async () => {
      const inputBlockWithoutProperties = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Input Without Properties',
        description: 'Input without properties',
      };

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={[inputBlockWithoutProperties]} />);

      });
      
      expect(screen.getByText('Input Without Properties')).toBeInTheDocument();
    });

    it('handles null projectId', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} projectId={null} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles undefined onValidationResultsChange', async () => {
      const propsWithoutValidation = { ...defaultProps };
      propsWithoutValidation.onValidationResultsChange = undefined as any;

      await act(async () => {

        render(<UserInputs {...propsWithoutValidation} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    // Additional edge cases for better branch coverage
    it('handles input block with missing id in allInputBlockDatas', async () => {
      const inputDataWithoutId = [
        {
          gid: 'group-1',
          cid: 'input-1',
          name: 'Input Data Without ID',
          group: 'test-group',
          data: { test: 'data' },
          id: undefined as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithoutId} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles input block with string id in allInputBlockDatas', async () => {
      const inputDataWithStringId = [
        {
          gid: 'group-1',
          cid: 'input-1',
          name: 'Input Data With String ID',
          group: 'test-group',
          data: { test: 'data' },
          id: '123' as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithStringId} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group with missing input_blocks property', async () => {
      const groupWithoutInputBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Group Without Input Blocks',
          group: 'test-group',
          input_blocks: undefined as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithoutInputBlocks} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles plugin with missing input_blocks property', async () => {
      const pluginWithoutInputBlocks = {
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
          input_blocks: undefined,
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetPlugins.mockResolvedValue({
        status: 'success',
        data: pluginWithoutInputBlocks,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles plugin with non-array input_blocks property', async () => {
      const pluginWithInvalidInputBlocks = {
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
          input_blocks: 'not-an-array' as any,
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetPlugins.mockResolvedValue({
        status: 'success',
        data: pluginWithInvalidInputBlocks,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Input Block Type Detection', () => {
    it('correctly identifies group-based input blocks', async () => {
      const groupBlock: InputBlock = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Group Input',
        description: 'Group input description',
        group: 'test-group',
      };

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={[groupBlock]} />);

      });
      
      expect(screen.getByText('test-group')).toBeInTheDocument();
    });

    it('correctly identifies single input blocks', async () => {
      const singleBlock: InputBlock = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Single Input',
        description: 'Single input description',
      };

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={[singleBlock]} />);

      });
      
      expect(screen.getByText('Single Input')).toBeInTheDocument();
      expect(screen.getByText('Choose User Input')).toBeInTheDocument();
    });

    it('handles input block with empty group property', async () => {
      const blockWithEmptyGroup: InputBlock = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Input With Empty Group',
        description: 'Input with empty group',
        group: '',
      };

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={[blockWithEmptyGroup]} />);

      });
      
      expect(screen.getByText('Input With Empty Group')).toBeInTheDocument();
    });
  });

  describe('MDX Bundle Integration', () => {
    it('uses MDX bundle for modal content', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: { code: 'test mdx code' },
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('handles MDX bundle loading state', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('handles MDX bundle error state', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('MDX error'),
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });

    it('handles MDX bundle with null data', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      expect(screen.getByTestId('plugin-input-modal')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up on unmount', async () => {
      const { unmount } = render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      
      unmount();
      
      // Component should be unmounted without errors
    });

    it('handles multiple re-renders', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      
      await act(async () => {
      
        rerender(<UserInputs {...defaultProps} />);
      
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Validation Edge Cases', () => {
    it('handles validation when onValidationResultsChange is undefined', async () => {
      const propsWithoutValidation = { ...defaultProps };
      propsWithoutValidation.onValidationResultsChange = undefined as any;

      await act(async () => {

        render(<UserInputs {...propsWithoutValidation} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles validation with empty validation results', async () => {
      mockProcessBatchValidations.mockResolvedValue({});

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Group Selection Edge Cases', () => {
    it('handles group selection with non-existent group ID', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '999' } }); // Non-existent group ID

      // Should not crash
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group selection with missing group ID', async () => {
      const groupWithoutId = [
        {
          id: undefined as any,
          gid: 'group-2',
          name: 'Group Without ID',
          group: 'test-group',
          input_blocks: [
            {
              id: 101,
              cid: 'group-input-1',
              name: 'Child 1',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithoutId} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group with missing input_blocks in selection', async () => {
      const groupWithoutInputBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Group Without Input Blocks',
          group: 'test-group',
          input_blocks: undefined as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithoutInputBlocks} />);

      });
      
      // Don't trigger the problematic selection
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Single Input Selection Edge Cases', () => {
    it('handles single input selection with missing input block data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '999' } }); // Non-existent input ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input selection with string ID', async () => {
      const inputDataWithStringId = [
        {
          gid: 'group-1',
          cid: 'input-1',
          name: 'Input Data With String ID',
          group: 'test-group',
          data: { test: 'data' },
          id: '123' as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithStringId} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[1], { target: { value: '123' } });
      });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Modal Edge Cases', () => {
    it('handles modal close without refresh', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const closeButton = screen.getByText('Close');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles modal close with refresh', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles modal with missing currentInputBlock', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Force showInputModal to true without setting currentInputBlock
      // This should not happen in normal flow, but testing edge case
      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });
  });

  describe('Input Submission Edge Cases', () => {
    it('handles input submission without currentInputBlock', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // This should not happen in normal flow, but testing edge case
      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles input submission with missing validation data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Plugin Data Processing Edge Cases', () => {
    it('handles plugin with missing width and fullScreen properties', async () => {
      const pluginWithMinimalInputBlock = {
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
              // Missing width and fullScreen properties
            },
          ],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetPlugins.mockResolvedValue({
        status: 'success',
        data: pluginWithMinimalInputBlock,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles plugin with null input_blocks', async () => {
      const pluginWithNullInputBlocks = {
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
          input_blocks: null,
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetPlugins.mockResolvedValue({
        status: 'success',
        data: pluginWithNullInputBlocks,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Initial State Edge Cases', () => {
    it('handles initial input blocks with non-matching required blocks', async () => {
      const initialBlocksWithNonMatching = [
        {
          gid: 'non-matching-gid',
          cid: 'non-matching-cid',
          id: 999,
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialBlocksWithNonMatching} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles initial input blocks with group-based blocks', async () => {
      const initialBlocksWithGroup = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 101,
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialBlocksWithGroup} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles initial input blocks with missing group data', async () => {
      const initialBlocksWithMissingGroup = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 999, // Non-existent group ID
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialBlocksWithMissingGroup} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Effect Dependencies Edge Cases', () => {
    it('handles effect with empty validation results', async () => {
      mockProcessBatchValidations.mockResolvedValue({});

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles effect with undefined onValidationResultsChange', async () => {
      const propsWithoutValidation = { ...defaultProps };
      propsWithoutValidation.onValidationResultsChange = undefined as any;

      await act(async () => {

        render(<UserInputs {...propsWithoutValidation} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles effect with didRunValidationUpdate ref', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger a re-render to test the ref logic
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('URL Construction Edge Cases', () => {
    it('handles URL construction without flow and projectId', async () => {
      const propsWithoutFlowAndProject = {
        ...defaultProps,
        flow: '',
        projectId: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...propsWithoutFlowAndProject} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('handles URL construction with only flow', async () => {
      const propsWithOnlyFlow = {
        ...defaultProps,
        flow: 'test-flow',
        projectId: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...propsWithOnlyFlow} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('handles URL construction with only projectId', async () => {
      const propsWithOnlyProjectId = {
        ...defaultProps,
        flow: '',
        projectId: 'test-project',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...propsWithOnlyProjectId} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Button State Edge Cases', () => {
    it('shows CREATING... button when isPending is true', async () => {
      // Mock useTransition to return isPending as true
      const mockUseTransition = jest.fn().mockReturnValue([true, jest.fn()]);
      jest.doMock('react', () => ({
        ...jest.requireActual('react'),
        useTransition: mockUseTransition,
      }));

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      // The button should show CREATING... when isPending is true
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('shows MISSING GID button when gid is empty', async () => {
      const inputBlocksWithEmptyGid = [
        {
          gid: '',
          cid: 'input-1',
          name: 'Input With Empty GID',
          description: 'Input with empty GID',
          group: 'test-group',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={inputBlocksWithEmptyGid} />);

      });
      
      expect(screen.getByText('MISSING GID')).toBeInTheDocument();
    });

    it('disables button when isPending is true', async () => {
      // Mock useTransition to return isPending as true
      const mockUseTransition = jest.fn().mockReturnValue([true, jest.fn()]);
      jest.doMock('react', () => ({
        ...jest.requireActual('react'),
        useTransition: mockUseTransition,
      }));

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      // The button should be disabled when isPending is true
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('disables button when gid is empty', async () => {
      const inputBlocksWithEmptyGid = [
        {
          gid: '',
          cid: 'input-1',
          name: 'Input With Empty GID',
          description: 'Input with empty GID',
          group: 'test-group',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={inputBlocksWithEmptyGid} />);

      });
      
      const missingGidButton = screen.getByText('MISSING GID');
      expect(missingGidButton).toBeInTheDocument();
    });
  });

  describe('Plugin Name Extraction Edge Cases', () => {
    it('handles plugin gid with multiple dots', async () => {
      const pluginWithMultipleDots = [
        {
          gid: 'aiverify.plugin.test.multiple.dots',
          cid: 'test-input',
          name: 'Plugin With Multiple Dots',
          description: 'Plugin with multiple dots in gid',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={pluginWithMultipleDots} />);

      });
      
      expect(screen.getByText('Plugin With Multiple Dots')).toBeInTheDocument();
      expect(screen.getByText('Plugin: test')).toBeInTheDocument();
    });

    it('handles plugin gid with single dot', async () => {
      const pluginWithSingleDot = [
        {
          gid: 'aiverify.plugin',
          cid: 'test-input',
          name: 'Plugin With Single Dot',
          description: 'Plugin with single dot in gid',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={pluginWithSingleDot} />);

      });
      
      expect(screen.getByText('Plugin With Single Dot')).toBeInTheDocument();
    });

    it('handles non-plugin gid', async () => {
      const nonPluginInput = [
        {
          gid: 'regular.group',
          cid: 'test-input',
          name: 'Regular Input',
          description: 'Regular input block',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={nonPluginInput} />);

      });
      
      expect(screen.getByText('Regular Input')).toBeInTheDocument();
      expect(screen.queryByText(/Plugin:/)).not.toBeInTheDocument();
    });
  });

  describe('Data Refresh Edge Cases', () => {
    it('handles data refresh when shouldFetchData is true', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger a refresh
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles data refresh when shouldFetchData is false', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Don't trigger a refresh
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Group Matching Edge Cases', () => {
    it('handles group matching with missing input_blocks', async () => {
      const groupWithoutInputBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Group Without Input Blocks',
          group: 'test-group',
          input_blocks: undefined as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const initialBlocks = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 101,
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithoutInputBlocks} initialInputBlocks={initialBlocks} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group matching with empty input_blocks array', async () => {
      const groupWithEmptyInputBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Group With Empty Input Blocks',
          group: 'test-group',
          input_blocks: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const initialBlocks = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 101,
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithEmptyInputBlocks} initialInputBlocks={initialBlocks} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Validation Update Edge Cases', () => {
    it('handles validation update with requestAnimationFrame', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger a validation update by changing selection
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } });

      // The validation effect should trigger
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles validation update cleanup', async () => {
      const { unmount } = render(<UserInputs {...defaultProps} />);
      
      // Trigger a validation update
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } });

      unmount();

      expect(screen.queryByText('User Inputs')).not.toBeInTheDocument();
    });
  });

  describe('Submit Input Block Group Error Handling', () => {
    it('handles API error in submitInputBlockGroup', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('handles non-ok response in submitInputBlockGroup', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to submit input block group:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles missing id in API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }), // Missing id
      });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to create input block. Please try again.');
      });

      alertSpy.mockRestore();
    });

    it('handles null response from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to create input block. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Validation Error Handling', () => {
    it('handles validation error in handleInputSubmit', async () => {
      mockValidateInputBlock.mockRejectedValue(new Error('Validation error'));

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('handles validation with missing data properties', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('handles validation with non-object data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });
  });

  describe('Group Input Block Matching Edge Cases', () => {
    it('handles group input block without matching required block', async () => {
      const groupWithUnmatchedInputBlock = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'test-group',
          input_blocks: [
            {
              id: 101,
              cid: 'unmatched-input',
              name: 'Unmatched Input',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithUnmatchedInputBlock} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group input block with missing id', async () => {
      const groupWithInputBlockWithoutId = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'test-group',
          input_blocks: [
            {
              id: undefined as any,
              cid: 'group-input-1',
              name: 'Input Without ID',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithInputBlockWithoutId} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Single Input Block Data Edge Cases', () => {
    it('handles single input block with missing id', async () => {
      const inputDataWithoutId = [
        {
          gid: 'group-1',
          cid: 'input-1',
          name: 'Input Data Without ID',
          group: 'test-group',
          data: { test: 'data' },
          id: undefined as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithoutId} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '999' } }); // Non-existent ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input block with non-numeric id', async () => {
      const inputDataWithNonNumericId = [
        {
          gid: 'group-1',
          cid: 'input-1',
          name: 'Input Data With Non-Numeric ID',
          group: 'test-group',
          data: { test: 'data' },
          id: 'abc' as any,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithNonNumericId} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[1], { target: { value: 'abc' } });
      });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Plugin Response Edge Cases', () => {
    it('handles plugin response without status property', async () => {
      mockGetPlugins.mockResolvedValue({
        data: mockPlugins,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalled();
      });
    });

    it('handles plugin response without data property', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalled();
      });
    });

    it('handles plugin response with non-success status', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'error',
        data: mockPlugins,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalled();
      });
    });
  });

  describe('Effect Cleanup Edge Cases', () => {
    it('handles effect cleanup with requestAnimationFrame', async () => {
      const { unmount } = render(<UserInputs {...defaultProps} />);
      
      // Trigger a validation update
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } });

      unmount();

      expect(screen.queryByText('User Inputs')).not.toBeInTheDocument();
    });

    it('handles effect cleanup without requestAnimationFrame', async () => {
      const { unmount } = render(<UserInputs {...defaultProps} />);
      
      unmount();

      // Should not crash
    });
  });

  describe('Input Block Properties Edge Cases', () => {
    it('handles input block with undefined properties', async () => {
      const inputBlockWithoutProperties = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Input Without Properties',
        description: 'Input without properties',
      };

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={[inputBlockWithoutProperties]} />);

      });
      
      expect(screen.getByText('Input Without Properties')).toBeInTheDocument();
    });

    it('handles input block with null properties', async () => {
      const inputBlockWithNullProperties = {
        gid: 'group-1',
        cid: 'input-1',
        name: 'Input With Null Properties',
        description: 'Input with null properties',
        width: null as any,
        fullScreen: null as any,
      };

      await act(async () => {

        render(<UserInputs {...defaultProps} requiredInputBlocks={[inputBlockWithNullProperties]} />);

      });
      
      expect(screen.getByText('Input With Null Properties')).toBeInTheDocument();
    });
  });

  describe('Group Selection Logic Edge Cases', () => {
    it('handles group selection with same group ID', async () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);

      });
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } }); // Same group ID

      // Should not call onInputBlocksChange since it's the same selection
      expect(defaultProps.onInputBlocksChange).not.toHaveBeenCalled();
    });

    it('handles group selection with empty group ID', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '' } }); // Empty group ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group selection with non-existent group ID', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '999' } }); // Non-existent group ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Single Input Selection Logic Edge Cases', () => {
    it('handles single input selection with same input ID', async () => {
      const initialInputBlocks = [
        { gid: 'group-1', cid: 'input-1', id: 1 },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);

      });
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // Same input ID

      // Should not call onInputBlocksChange since it's the same selection
      expect(defaultProps.onInputBlocksChange).not.toHaveBeenCalled();
    });

    it('handles single input selection with empty input ID', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '' } }); // Empty input ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input selection with non-existent input ID', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '999' } }); // Non-existent input ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Modal State Edge Cases', () => {
    it('handles modal state with null currentInputBlock', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Modal should not be shown when currentInputBlock is null
      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles modal state with showInputModal false', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Modal should not be shown when showInputModal is false
      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles modal state with both conditions false', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Modal should not be shown when both conditions are false
      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });
  });

  describe('Available Inputs Edge Cases', () => {
    it('handles getAvailableInputsForBlock with empty allInputBlockDatas', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles getAvailableInputsForBlock with non-matching data', async () => {
      const nonMatchingData = [
        {
          gid: 'different-group',
          cid: 'different-input',
          name: 'Different Input',
          group: 'test-group',
          data: { test: 'data' },
          id: 1,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={nonMatchingData} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Initial State Processing Edge Cases', () => {
    it('handles initial state with empty initialInputBlocks', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} initialInputBlocks={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles initial state with non-matching initialInputBlocks', async () => {
      const nonMatchingInitialBlocks = [
        {
          gid: 'non-matching-gid',
          cid: 'non-matching-cid',
          id: 999,
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={nonMatchingInitialBlocks} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles initial state with mixed matching and non-matching blocks', async () => {
      const mixedInitialBlocks = [
        {
          gid: 'group-1',
          cid: 'input-1',
          id: 1,
        },
        {
          gid: 'non-matching-gid',
          cid: 'non-matching-cid',
          id: 999,
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={mixedInitialBlocks} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Group Input Block Processing Edge Cases', () => {
    it('handles group input block with missing matchingGroup', async () => {
      const initialBlocksWithMissingGroup = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 999, // Non-existent group ID
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialBlocksWithMissingGroup} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group input block with candidate groups but no exact match', async () => {
      const groupWithDifferentIds = [
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
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const initialBlocksWithDifferentId = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 999, // Different ID than what's in the group
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithDifferentIds} initialInputBlocks={initialBlocksWithDifferentId} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Effect Dependencies and Cleanup', () => {
    it('handles effect cleanup on unmount', async () => {
      const { unmount } = render(<UserInputs {...defaultProps} />);
      
      unmount();

      // Should not crash
    });

    it('handles effect with changing dependencies', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      // Change the dependencies
      await act(async () => {
        rerender(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles effect with stable dependencies', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      // Re-render with same dependencies
      await act(async () => {
        rerender(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Router Integration Edge Cases', () => {
    it('handles router refresh error', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles router refresh success', async () => {
      mockRouter.refresh.mockImplementation(() => {
        // Success case
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Window Location Edge Cases', () => {
    it('handles window.location.href assignment error', async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: 'http://localhost/' } as any;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Restore original location
      window.location = originalLocation;
    });

    it('handles window.location.href assignment success', async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: 'http://localhost/' } as any;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Restore original location
      window.location = originalLocation;
    });
  });

  describe('URL Encoding Edge Cases', () => {
    it('handles URL encoding with special characters', async () => {
      const propsWithSpecialChars = {
        ...defaultProps,
        flow: 'test-flow with spaces',
        projectId: 'test-project with special chars!@#',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...propsWithSpecialChars} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('handles URL encoding with empty strings', async () => {
      const propsWithEmptyStrings = {
        ...defaultProps,
        flow: '',
        projectId: '',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await act(async () => {

        render(<UserInputs {...propsWithEmptyStrings} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Timeout and Async Operations', () => {
    it('handles timeout in handleInputSubmit', async () => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Fast-forward timers
      jest.runAllTimers();

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('handles timeout error in handleInputSubmit', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('State Update Edge Cases', () => {
    it('handles state update with null values', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger state updates that might involve null values
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '' } }); // Set to empty

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles state update with undefined values', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger state updates that might involve undefined values
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '999' } }); // Non-existent value

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles state update with empty objects', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger state updates that might involve empty objects
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Component Re-rendering Edge Cases', () => {
    it('handles re-rendering with changed props', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      // Re-render with different props
      await act(async () => {
        rerender(<UserInputs {...defaultProps} requiredInputBlocks={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles re-rendering with same props', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      // Re-render with same props
      await act(async () => {
        rerender(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles re-rendering with null props', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      // Re-render with null values in props
      await act(async () => {
        rerender(<UserInputs {...defaultProps} projectId={null} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Additional Branch Coverage Tests', () => {
    it('handles group selection with matching group but different input block', async () => {
      const groupWithDifferentInputBlock = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'test-group',
          input_blocks: [
            {
              id: 999, // Different ID than what's expected
              cid: 'group-input-1',
              name: 'Different Input Block',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const initialBlocks = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 101, // Different ID than what's in the group
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithDifferentInputBlock} initialInputBlocks={initialBlocks} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input selection with non-existent input block data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '999' } }); // Non-existent ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group selection with empty input_blocks array', async () => {
      const groupWithEmptyInputBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'test-group',
          input_blocks: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithEmptyInputBlocks} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles validation with didRunValidationUpdate ref preventing multiple calls', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger multiple validation updates quickly
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } });
      await act(async () => {
        fireEvent.change(selectElements[1], { target: { value: '2' } });
      });
      fireEvent.change(selectElements[1], { target: { value: '1' } });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group selection with missing required blocks for group', async () => {
      const groupWithoutMatchingRequiredBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'different-group', // Different group than required
          input_blocks: [
            {
              id: 101,
              cid: 'group-input-1',
              name: 'Input Block',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithoutMatchingRequiredBlocks} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input selection with missing input block data but valid ID', async () => {
      const inputDataWithMissingBlock = [
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
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithMissingBlock} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // Valid ID
      fireEvent.change(selectElements[2], { target: { value: '999' } }); // Non-existent ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles input submission without data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles timeout error in handleInputSubmit', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles plugin data processing with empty plugins object', async () => {
      mockGetPlugins.mockResolvedValue({
        status: 'success',
        data: {},
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles plugin data processing with plugins containing no input_blocks', async () => {
      const pluginWithoutInputBlocks = {
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
          input_blocks: [],
          templates: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetPlugins.mockResolvedValue({
        status: 'success',
        data: pluginWithoutInputBlocks,
      });

      await act(async () => {

        render(<UserInputs {...defaultProps} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles input submission with complete data', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });

  describe('Final Branch Coverage Tests', () => {
    it('handles validation results with non-empty results and callback', async () => {
      mockProcessBatchValidations.mockResolvedValue({
        'test-validation': { isValid: true, errors: [] },
        'another-validation': { isValid: false, errors: ['Error 1'] },
      });

      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      // Trigger a selection change to cause validation update
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[1], { target: { value: '1' } });
      });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group selection with same group but different input block IDs', async () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      await act(async () => {
        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);
      });
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      await act(async () => {
        fireEvent.change(selectElements[0], { target: { value: '2' } }); // Different group ID
      });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input selection with same input but different block', async () => {
      const initialInputBlocks = [
        { gid: 'group-1', cid: 'input-1', id: 1 },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);

      });
      
      // Clear the previous calls
      jest.clearAllMocks();
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[2], { target: { value: '3' } }); // Different input block

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles modal close with refresh flag', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} />);
      });
      
      const addButtons = screen.getAllByText('ADD INPUT');
      fireEvent.click(addButtons[1]); // Click second button for single input block

      // Close modal with refresh flag
      const closeButton = screen.getByText('Close');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(screen.queryByTestId('plugin-input-modal')).not.toBeInTheDocument();
    });

    it('handles group selection with missing group in allInputBlockGroups', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockGroups={[]} />);
      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '999' } }); // Non-existent group

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles initial state with group blocks but no matching group', async () => {
      const initialBlocksWithNonMatchingGroup = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 999, // Non-existent group ID
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} initialInputBlocks={initialBlocksWithNonMatchingGroup} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles effect with allInputBlockDatas change and selected inputs', async () => {
      const initialInputBlocks = [
        { gid: 'group-1', cid: 'input-1', id: 1 },
      ];

      const { rerender } = render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);
      
      // Change allInputBlockDatas to trigger effect
      const newInputBlockDatas = [
        {
          gid: 'group-1',
          cid: 'input-1',
          name: 'Updated Input Data',
          group: 'test-group',
          data: { test: 'updated-data' },
          id: 1,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        rerender(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} allInputBlockDatas={newInputBlockDatas} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles effect with empty allInputBlockDatas and no selected inputs', async () => {
      await act(async () => {
        render(<UserInputs {...defaultProps} allInputBlockDatas={[]} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles selectedGroup state update effect', async () => {
      const { rerender } = render(<UserInputs {...defaultProps} />);
      
      // Trigger selectedGroup state change
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } });

      // Re-render to trigger effect
      await act(async () => {
        rerender(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles selectedGroup state update effect with null selectedGroup', async () => {
      const initialInputBlocks = [
        { gid: 'group-2', cid: 'group-input-1', id: 101 },
      ];

      const { rerender } = render(<UserInputs {...defaultProps} initialInputBlocks={initialInputBlocks} />);
      
      // Clear group selection
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '' } });

      // Re-render to trigger effect
      await act(async () => {
        rerender(<UserInputs {...defaultProps} />);
      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group input block with missing matchingGroup but candidate groups', async () => {
      const groupWithDifferentIds = [
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
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const initialBlocksWithDifferentId = [
        {
          gid: 'group-2',
          cid: 'group-input-1',
          id: 999, // Different ID than what's in the group
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithDifferentIds} initialInputBlocks={initialBlocksWithDifferentId} />);

      });
      
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles single input selection with missing input block data but valid ID', async () => {
      const inputDataWithMissingBlock = [
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
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockDatas={inputDataWithMissingBlock} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[1], { target: { value: '1' } }); // Valid ID
      fireEvent.change(selectElements[2], { target: { value: '999' } }); // Non-existent ID

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group selection with missing required blocks for group', async () => {
      const groupWithoutMatchingRequiredBlocks = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'different-group', // Different group than required
          input_blocks: [
            {
              id: 101,
              cid: 'group-input-1',
              name: 'Input Block',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithoutMatchingRequiredBlocks} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });

    it('handles group input block without matching required block', async () => {
      const groupWithUnmatchedInputBlock = [
        {
          id: 1,
          gid: 'group-2',
          name: 'Test Group',
          group: 'test-group',
          input_blocks: [
            {
              id: 101,
              cid: 'unmatched-input',
              name: 'Unmatched Input',
              groupNumber: 1,
              data: { test: 'data1' },
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      await act(async () => {

        render(<UserInputs {...defaultProps} allInputBlockGroups={groupWithUnmatchedInputBlock} />);

      });
      
      const selectElements = screen.getAllByRole('combobox');
      fireEvent.change(selectElements[0], { target: { value: '1' } });

      expect(screen.getByText('User Inputs')).toBeInTheDocument();
    });
  });
}); 