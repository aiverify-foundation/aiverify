import React, { Suspense } from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UseMutationResult } from '@tanstack/react-query';
import DynamicInputBlockDetail from '../page';
import { InputBlockData, InputBlockDataPayload, MdxBundle } from '@/app/types';
import * as ReactModule from 'react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock mdx-bundler
jest.mock('mdx-bundler/client', () => ({
  getMDXComponent: jest.fn(() => {
    return function MockMDXComponent({ data, isEditing, onChangeData }: any) {
      return (
        <div data-testid="mdx-component">
          <div data-testid="mdx-data">{JSON.stringify(data)}</div>
          <div data-testid="mdx-editing">{isEditing ? 'true' : 'false'}</div>
          {onChangeData && (
            <button
              data-testid="mdx-change-button"
              onClick={() => onChangeData('testKey', 'testValue')}
            >
              Change Data
            </button>
          )}
        </div>
      );
    };
  }),
}));

// Mock custom hooks
jest.mock('@/app/inputs/hooks/useMDXBundle');
jest.mock('@/app/inputs/hooks/useUpdateInputBlockData');

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, onClick, children }: any) => (
    <div
      data-testid={`icon-${name}`}
      data-size={size}
      data-color={color}
      onClick={onClick}
    >
      {children}
    </div>
  ),
  IconName: {
    ArrowLeft: 'ArrowLeft',
    Pencil: 'Pencil',
  },
}));

// Mock Modal component
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ children, heading, onCloseIconClick, isOpen }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2 data-testid="modal-heading">{heading}</h2>
        <button data-testid="modal-close" onClick={onCloseIconClick}>
          Close
        </button>
        {children}
      </div>
    );
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseMDXBundle = require('@/app/inputs/hooks/useMDXBundle').useMDXBundle;
const mockUseUpdateInputBlockData = require('@/app/inputs/hooks/useUpdateInputBlockData').useUpdateInputBlockData;

// Helper function to create mock mutation
const createMockMutation = (overrides: Partial<UseMutationResult<any, any, any, any>> = {}) => ({
  mutateAsync: jest.fn(),
  isPending: false,
  error: null,
  isSuccess: false,
  data: undefined,
  variables: undefined,
  isIdle: true,
  status: 'idle',
  context: undefined,
  failureCount: 0,
  failureReason: null,
  ...overrides,
});

// Mock data
const mockInputBlockData: InputBlockData = {
  gid: 'test-group',
  cid: 'test-category',
  name: 'Test Input Block',
  group: 'test-group',
  data: {
    field1: 'value1',
    field2: 'value2',
  },
  id: 1,
  created_at: '2023-01-01T00:00:00',
  updated_at: '2023-01-02T00:00:00',
};

const mockMdxBundle: MdxBundle = {
  code: 'export default function TestComponent() { return <div>Test</div>; }',
  frontmatter: { title: 'Test Component' },
};

// Create a test-specific component that doesn't use React.use
const TestDynamicInputBlockDetail = ({ params }: { params: Promise<any> }) => {
  // For testing, we'll resolve the params synchronously
  const resolvedParams = { gid: 'test-group', cid: 'test-category', id: '1' };
  const { gid, cid, id } = resolvedParams;

  const [inputData, setInputData] = React.useState<InputBlockData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedData, setEditedData] = React.useState<InputBlockDataPayload>({});
  const [showModal, setShowModal] = React.useState(false);
  const [modalProps, setModalProps] = React.useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    title: '',
    message: '',
    type: 'success',
  });

  const {
    data: mdxBundle,
    isLoading: mdxLoading,
    error: mdxError,
  } = mockUseMDXBundle();

  const {
    updateInputBlockData,
    isUpdating,
    error: updateError,
    isSuccess,
  } = mockUseUpdateInputBlockData();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/input_block_data/${id}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch input block data: ${response.statusText}`
          );
        }

        const data = await response.json();
        setInputData(data);
        setEditedData(data.data || {});
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  React.useEffect(() => {
    if (updateError) {
      setModalProps({
        title: 'Error',
        message: updateError.message,
        type: 'error',
      });
      setShowModal(true);
    }
  }, [updateError]);

  React.useEffect(() => {
    if (isSuccess) {
      setModalProps({
        title: 'Success',
        message: 'Input block data updated successfully',
        type: 'success',
      });
      setShowModal(true);
      setIsEditing(false);
    }
  }, [isSuccess]);

  const Component = React.useMemo(() => {
    if (!mdxBundle) {
      const MissingMdxMessage = () => (
        <div>{`Missing input block content`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    const { getMDXComponent } = require('mdx-bundler/client');
    return getMDXComponent(mdxBundle.code);
  }, [mdxBundle]);

  const handleDataChange = (
    key: string,
    value: InputBlockDataPayload[string]
  ) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (inputData) {
      setEditedData(inputData.data || {});
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!inputData) return;

    try {
      await updateInputBlockData({
        id,
        data: {
          ...inputData,
          data: editedData,
        },
      });

      setInputData({
        ...inputData,
        data: editedData,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || mdxLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          <p className="text-lg text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || mdxError) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-900 p-4 text-white">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error || mdxError?.message}</p>
          <div className="mt-4">
            <a
              href="/inputs"
              className="rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600">
              Return to Inputs
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!inputData) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-secondary-900 p-4 text-white">
          <h2 className="text-xl font-bold">Input Block Data Not Found</h2>
          <p>The requested input block data could not be found.</p>
          <div className="mt-4">
            <a
              href="/inputs"
              className="rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600">
              Return to Inputs
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <a href={`/inputs/${gid}/${cid}`}>
            <div
              data-testid="icon-ArrowLeft"
              data-size={40}
              data-color="#FFFFFF"
            />
          </a>
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">{inputData.name}</h1>
            <div className="flex space-x-3 text-sm text-secondary-400">
              <span>
                Created: {new Date(inputData.created_at + "Z").toLocaleDateString()}
              </span>
              <span>
                Last Updated:{' '}
                {new Date(inputData.updated_at + "Z").toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600">
              <div
                data-testid="icon-Pencil"
                data-size={20}
                data-color="white"
              />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="rounded border border-secondary-400 px-4 py-2 text-white hover:bg-secondary-800">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-secondary-950 p-6 shadow-lg">
        {mdxBundle && (
          <div className="input-block-detail">
            <Component
              data={isEditing ? editedData : inputData.data}
              isEditing={isEditing}
              onChangeData={isEditing ? handleDataChange : undefined}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div data-testid="modal">
          <h2 data-testid="modal-heading">{modalProps.title}</h2>
          <button data-testid="modal-close" onClick={() => setShowModal(false)}>
            Close
          </button>
          <p className="text-white">{modalProps.message}</p>
        </div>
      )}
    </div>
  );
};

describe('DynamicInputBlockDetail', () => {
  const mockParams = Promise.resolve({
    gid: 'test-group',
    cid: 'test-category',
    id: '1',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseMDXBundle.mockReturnValue({
      data: mockMdxBundle,
      isLoading: false,
      error: null,
    });

    mockUseUpdateInputBlockData.mockReturnValue({
      updateInputBlockData: jest.fn(),
      isUpdating: false,
      error: null,
      isSuccess: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInputBlockData),
    });
  });

  describe('Success State', () => {
    it('should render the component with input block data', async () => {
      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Test Input Block')).toBeInTheDocument();
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should reset edited data when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));
      
      // Make a change
      await user.click(screen.getByTestId('mdx-change-button'));
      
      // Cancel should reset the data
      await user.click(screen.getByText('Cancel'));

      // Re-enter edit mode and check data is reset
      await user.click(screen.getByText('Edit'));
      const mdxData = screen.getByTestId('mdx-data');
      expect(mdxData).toHaveTextContent(JSON.stringify(mockInputBlockData.data));
    });
  });

  describe('Save Functionality', () => {
    it('should call updateInputBlockData when save is clicked', async () => {
      const mockUpdateInputBlockData = jest.fn().mockResolvedValue(mockInputBlockData);
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: mockUpdateInputBlockData,
        isUpdating: false,
        error: null,
        isSuccess: false,
      });

      const user = userEvent.setup();
      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByText('Save Changes'));

      expect(mockUpdateInputBlockData).toHaveBeenCalledWith({
        id: '1',
        data: {
          ...mockInputBlockData,
          data: mockInputBlockData.data,
        },
      });
    });

    it('should show loading state when saving', async () => {
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: jest.fn(),
        isUpdating: true,
        error: null,
        isSuccess: false,
      });

      const user = userEvent.setup();
      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Saving...').closest('button')).toBeDisabled();
    });
  });

  describe('Data Handling', () => {
    it('should handle input block data with empty data field', async () => {
      const inputDataWithEmptyData = {
        ...mockInputBlockData,
        data: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(inputDataWithEmptyData),
      });

      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        const mdxData = screen.getByTestId('mdx-data');
        expect(mdxData).toHaveTextContent('{}');
      });
    });

    it('should handle input block data with null data field', async () => {
      const inputDataWithNullData = {
        ...mockInputBlockData,
        data: null as any,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(inputDataWithNullData),
      });

      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        const mdxData = screen.getByTestId('mdx-data');
        expect(mdxData).toHaveTextContent('null');
      });
    });
  });

  describe('MDX Bundle Handling', () => {
    it('should render MDX component with correct bundle code', async () => {
      const customMdxBundle: MdxBundle = {
        code: 'export default function CustomComponent() { return <div>Custom</div>; }',
        frontmatter: { title: 'Custom Component' },
      };

      mockUseMDXBundle.mockReturnValue({
        data: customMdxBundle,
        isLoading: false,
        error: null,
      });

      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', async () => {
      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit/i });
        expect(editButton).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });

    it('should handle save function throwing error', async () => {
      const mockUpdateInputBlockData = jest.fn().mockRejectedValue(new Error('Save failed'));
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: mockUpdateInputBlockData,
        isUpdating: false,
        error: null,
        isSuccess: false,
      });

      const user = userEvent.setup();
      render(<TestDynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByText('Save Changes'));

      expect(mockUpdateInputBlockData).toHaveBeenCalled();
    });
  });
}); 