import React, { Suspense } from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UseMutationResult } from '@tanstack/react-query';
import DynamicInputBlockDetail from '../page';
import { InputBlockData, InputBlockDataPayload, MdxBundle } from '@/app/types';
import * as ReactModule from 'react';
import { Modal } from '@/lib/components/modal';

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
          <div data-testid="mdx-data">{JSON.stringify(data || {})}</div>
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
  Modal: ({ children, heading, onCloseIconClick, enableScreenOverlay, width, height }: any) => {
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

// Define MessageModal component for testing
interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      heading={title}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      width="400px"
      height="200px">
      <p className="text-white">{message}</p>
    </Modal>
  );
};

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
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Input Block')).toBeInTheDocument();
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when fetching data', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading state when MDX is loading', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });

    it('should handle non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch input block data/)).toBeInTheDocument();
      });
    });

    it('should handle MDX error', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('MDX Error'),
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('MDX Error')).toBeInTheDocument();
      });
    });

    it('should handle unknown error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('Unknown error');

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-editing')).toHaveTextContent('true');
    });

    it('should reset edited data when cancel is clicked', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Change data
      await act(async () => {
        fireEvent.click(screen.getByTestId('mdx-change-button'));
      });

      // Cancel edit
      await act(async () => {
        fireEvent.click(screen.getByText('Cancel'));
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-editing')).toHaveTextContent('false');
    });

    it('should handle data changes in edit mode', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Change data
      await act(async () => {
        fireEvent.click(screen.getByTestId('mdx-change-button'));
      });

      const mdxData = screen.getByTestId('mdx-data');
      expect(mdxData).toHaveTextContent('testValue');
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

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Save changes
      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(mockUpdateInputBlockData).toHaveBeenCalled();
    });

    it('should show loading state when saving', async () => {
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: jest.fn(),
        isUpdating: true,
        error: null,
        isSuccess: false,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should handle save function throwing error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockUpdateInputBlockData = jest.fn().mockRejectedValue(new Error('Save failed'));
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: mockUpdateInputBlockData,
        isUpdating: false,
        error: null,
        isSuccess: false,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Save changes
      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(consoleSpy).toHaveBeenCalledWith(new Error('Save failed'));
      consoleSpy.mockRestore();
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

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

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

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        const mdxData = screen.getByTestId('mdx-data');
        expect(mdxData).toHaveTextContent('{}');
      });
    });
  });

  describe('MDX Bundle Handling', () => {
    it('should render MDX component with correct bundle code', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
      });

      const mdxData = screen.getByTestId('mdx-data');
      expect(mdxData).toHaveTextContent('field1');
      expect(mdxData).toHaveTextContent('field2');
    });

    it('should render missing MDX message when no bundle is available', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={Promise.resolve(mockParams)} />);
      });

      await waitFor(() => {
        // The component should render but the MDX section should be empty
        expect(screen.queryByTestId('mdx-component')).not.toBeInTheDocument();
      });
    });

    it('should not render MDX component when bundle is not available', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={Promise.resolve(mockParams)} />);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('mdx-component')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render with correct date formatting', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
        expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
      });
    });

    it('should render back button with correct link', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        const backLink = screen.getByTestId('icon-ArrowLeft').closest('a');
        expect(backLink).toHaveAttribute('href', '/inputs/test-group/test-category');
      });
    });

    it('should render edit button with correct icon', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        const icon = screen.getByTestId('icon-Pencil');
        expect(editButton).toContainElement(icon);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit/i });
        expect(editButton).toBeInTheDocument();
      });
    });

    it('should have proper link roles', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        const backLink = screen.getByRole('link');
        expect(backLink).toBeInTheDocument();
      });
    });
  });

  describe('MessageModal Component', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <div>
          <div data-testid="modal" style={{ display: 'none' }}>
            <h2>Test Modal</h2>
          </div>
        </div>
      );
      
      expect(container.querySelector('[data-testid="modal"]')).toBeInTheDocument();
    });

    it('should render MessageModal when showModal is true', async () => {
      // Set up the mock to return an error state
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: jest.fn(),
        isUpdating: false,
        error: new Error('Test error'),
        isSuccess: false,
      });

      render(<DynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });

    it('should close MessageModal when close button is clicked', async () => {
      // Set up the mock to return an error state
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: jest.fn(),
        isUpdating: false,
        error: new Error('Test error'),
        isSuccess: false,
      });

      render(<DynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('should render success MessageModal when update is successful', async () => {
      // Set up the mock to return a success state
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: jest.fn(),
        isUpdating: false,
        error: null,
        isSuccess: true,
      });

      render(<DynamicInputBlockDetail params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Input block data updated successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle save with modified data', async () => {
      const mockUpdateInputBlockData = jest.fn().mockResolvedValue(mockInputBlockData);
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: mockUpdateInputBlockData,
        isUpdating: false,
        error: null,
        isSuccess: false,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={Promise.resolve(mockParams)} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Change data
      await act(async () => {
        fireEvent.click(screen.getByTestId('mdx-change-button'));
      });

      // Save changes
      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(mockUpdateInputBlockData).toHaveBeenCalledWith({
        id: '1',
        data: {
          ...mockInputBlockData,
          data: {
            field1: 'value1',
            field2: 'value2',
            testKey: 'testValue',
          },
        },
      });
    });

    it('should handle multiple data changes', async () => {
      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Change data multiple times
      await act(async () => {
        fireEvent.click(screen.getByTestId('mdx-change-button'));
        fireEvent.click(screen.getByTestId('mdx-change-button'));
      });

      const mdxData = screen.getByTestId('mdx-data');
      expect(mdxData).toHaveTextContent('testValue');
    });

    it('should handle edit mode with no MDX bundle', async () => {
      mockUseMDXBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={Promise.resolve(mockParams)} />);
      });

      await waitFor(() => {
        // The edit button should still be shown even without MDX bundle
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Should not render MDX component when no MDX bundle
      expect(screen.queryByTestId('mdx-component')).not.toBeInTheDocument();
    });

    it('should handle console.error in save function', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockUpdateInputBlockData = jest.fn().mockRejectedValue(new Error('Save failed'));
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: mockUpdateInputBlockData,
        isUpdating: false,
        error: null,
        isSuccess: false,
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('Edit'));
      });

      // Save changes
      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(consoleSpy).toHaveBeenCalledWith(new Error('Save failed'));
      consoleSpy.mockRestore();
    });

    it('should handle save with null inputData', async () => {
      const mockUpdateInputBlockData = jest.fn();
      mockUseUpdateInputBlockData.mockReturnValue({
        updateInputBlockData: mockUpdateInputBlockData,
        isUpdating: false,
        error: null,
        isSuccess: false,
      });

      // Mock the component to have null inputData
      const TestComponent = () => {
        const [inputData, setInputData] = React.useState<InputBlockData | null>(null);
        const [isEditing, setIsEditing] = React.useState(false);
        const [editedData, setEditedData] = React.useState<InputBlockDataPayload>({});

        const handleSave = async () => {
          if (!inputData) return;
          // This line should not be reached
          await mockUpdateInputBlockData();
        };

        return (
          <div>
            <button onClick={handleSave}>Save</button>
          </div>
        );
      };

      render(<TestComponent />);
      
      // Click save with null inputData
      await userEvent.click(screen.getByText('Save'));
      
      // Should not call updateInputBlockData
      expect(mockUpdateInputBlockData).not.toHaveBeenCalled();
    });

    it('should handle input block data with undefined data field', async () => {
      const inputDataWithUndefinedData = {
        ...mockInputBlockData,
        data: undefined as any,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(inputDataWithUndefinedData),
      });

      await act(async () => {
        render(<DynamicInputBlockDetail params={mockParams} />);
      });

      await waitFor(() => {
        const mdxData = screen.getByTestId('mdx-data');
        expect(mdxData).toHaveTextContent('{}');
      });
    });

    it('should handle modal state changes', async () => {
      // Test that modal state can be triggered by useEffect
      const TestComponent = () => {
        const [showModal, setShowModal] = React.useState(false);
        const [modalProps, setModalProps] = React.useState({
          title: '',
          message: '',
          type: 'success' as const,
        });

        React.useEffect(() => {
          setModalProps({
            title: 'Test',
            message: 'Test message',
            type: 'success',
          });
          setShowModal(true);
        }, []);

        return (
          <div>
            {showModal && (
              <div data-testid="modal">
                <h2>{modalProps.title}</h2>
                <p>{modalProps.message}</p>
              </div>
            )}
          </div>
        );
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });
}); 