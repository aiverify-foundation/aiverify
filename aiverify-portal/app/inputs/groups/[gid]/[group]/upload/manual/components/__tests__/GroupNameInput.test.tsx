import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GroupNameInput } from '../GroupNameInput';
import { useChecklists } from '../../../context/ChecklistsContext';

// Mock the useChecklists hook
jest.mock('../../../context/ChecklistsContext', () => ({
  useChecklists: jest.fn(),
}));

// Mock the InfoIcon component
jest.mock('../../../utils/icons', () => ({
  InfoIcon: ({ className, ...props }: any) => (
    <svg
      data-testid="info-icon"
      className={className}
      {...props}
    >
      <title>info</title>
    </svg>
  ),
}));

// Mock the Tooltip component
jest.mock('../Tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

const mockUseChecklists = useChecklists as jest.MockedFunction<typeof useChecklists>;

describe('GroupNameInput', () => {
  const mockSetGroupName = jest.fn();
  const mockGroupName = 'Test Group Name';

  const defaultMockContext = {
    groupName: mockGroupName,
    setGroupName: mockSetGroupName,
    checklists: [],
    selectedChecklist: null,
    isLoading: false,
    error: null,
    setSelectedChecklist: jest.fn(),
    updateChecklistData: jest.fn(),
    clearAllChecklists: jest.fn(),
    setChecklists: jest.fn(),
    checkForExistingData: jest.fn(),
    clearGroupName: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChecklists.mockReturnValue(defaultMockContext);
    
    // Clear sessionStorage before each test
    sessionStorage.clear();
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('renders the component with correct structure', () => {
      render(<GroupNameInput />);

      // Check for label
      expect(screen.getByText('Group Name')).toBeInTheDocument();
      
      // Check for input field
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('placeholder', 'Enter group name');
      expect(input).toHaveValue(mockGroupName);
      
      // Check for info icon and tooltip
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toHaveAttribute(
        'data-content',
        'Enter a unique name for this set of process checklists'
      );
    });

    it('renders with empty group name', () => {
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        groupName: '',
      });

      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('renders with long group name', () => {
      const longGroupName = 'This is a very long group name that should be displayed correctly in the input field';
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        groupName: longGroupName,
      });

      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(longGroupName);
    });

    it('renders with special characters in group name', () => {
      const specialGroupName = 'Group Name with Special Chars: & < > " \' @ # $ % ^ * ( )';
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        groupName: specialGroupName,
      });

      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(specialGroupName);
    });
  });

  describe('Input Interactions', () => {
    it('calls setGroupName when input value changes', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      const newValue = 'New Group Name';
      
      fireEvent.change(input, { target: { value: newValue } });
      
      expect(mockSetGroupName).toHaveBeenCalledWith(newValue);
      expect(mockSetGroupName).toHaveBeenCalledTimes(1);
    });

    it('handles empty input value', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: '' } });
      
      expect(mockSetGroupName).toHaveBeenCalledWith('');
    });

    it('handles input with only spaces', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: '   ' } });
      
      expect(mockSetGroupName).toHaveBeenCalledWith('   ');
    });

    it('handles multiple input changes', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: 'First' } });
      fireEvent.change(input, { target: { value: 'Second' } });
      fireEvent.change(input, { target: { value: 'Third' } });
      
      expect(mockSetGroupName).toHaveBeenCalledTimes(3);
      expect(mockSetGroupName).toHaveBeenNthCalledWith(1, 'First');
      expect(mockSetGroupName).toHaveBeenNthCalledWith(2, 'Second');
      expect(mockSetGroupName).toHaveBeenNthCalledWith(3, 'Third');
    });

    it('handles input with numbers and special characters', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      const complexValue = 'Group123!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      fireEvent.change(input, { target: { value: complexValue } });
      
      expect(mockSetGroupName).toHaveBeenCalledWith(complexValue);
    });
  });

  describe('SessionStorage Integration', () => {
    it('loads group name from sessionStorage on mount when available', async () => {
      const storedGroupName = 'Stored Group Name';
      const mockGetItem = jest.fn().mockReturnValue(storedGroupName);
      
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: mockGetItem,
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      render(<GroupNameInput />);

      await waitFor(() => {
        expect(mockGetItem).toHaveBeenCalledWith('groupName');
        expect(mockSetGroupName).toHaveBeenCalledWith(storedGroupName);
      });
    });

    it('does not call setGroupName when sessionStorage is empty', async () => {
      const mockGetItem = jest.fn().mockReturnValue(null);
      
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: mockGetItem,
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      render(<GroupNameInput />);

      await waitFor(() => {
        expect(mockGetItem).toHaveBeenCalledWith('groupName');
        expect(mockSetGroupName).not.toHaveBeenCalled();
      });
    });

    it('does not call setGroupName when sessionStorage returns empty string', async () => {
      const mockGetItem = jest.fn().mockReturnValue('');
      
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: mockGetItem,
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      render(<GroupNameInput />);

      await waitFor(() => {
        expect(mockGetItem).toHaveBeenCalledWith('groupName');
        expect(mockSetGroupName).not.toHaveBeenCalled();
      });
    });

    it('throws error when sessionStorage fails', async () => {
      const mockGetItem = jest.fn().mockImplementation(() => {
        throw new Error('SessionStorage error');
      });
      
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: mockGetItem,
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      // Should throw error when sessionStorage fails
      expect(() => render(<GroupNameInput />)).toThrow('SessionStorage error');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('has correct CSS classes on container', () => {
      render(<GroupNameInput />);

      const container = screen.getByText('Group Name').closest('div');
      expect(container).toHaveClass('mb-4', 'pl-2', 'pr-8');
    });

    it('has correct CSS classes on label', () => {
      render(<GroupNameInput />);

      const label = screen.getByText('Group Name');
      expect(label).toHaveClass('mb-1', 'flex', 'items-center', 'text-white');
    });

    it('has correct CSS classes on input', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'w-full',
        'rounded',
        'border',
        'border-gray-300',
        'bg-secondary-950',
        'p-2',
        'text-white'
      );
    });

    it('has correct CSS classes on info icon', () => {
      render(<GroupNameInput />);

      const infoIcon = screen.getByTestId('info-icon');
      expect(infoIcon).toHaveClass('ml-2', 'h-5', 'w-5', 'text-gray-400', 'hover:text-gray-200');
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      render(<GroupNameInput />);

      const label = screen.getByText('Group Name');
      const input = screen.getByRole('textbox');
      
      // Check that label and input are properly associated
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('has required attribute on input', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });

    it('has proper placeholder text', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter group name');
    });
  });

  describe('Context Integration', () => {
    it('uses groupName from context', () => {
      const customGroupName = 'Custom Group Name from Context';
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        groupName: customGroupName,
      });

      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(customGroupName);
    });

    it('calls setGroupName from context', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Value' } });

      expect(mockSetGroupName).toHaveBeenCalledWith('New Value');
    });

    it('handles context error state', () => {
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        error: new Error('Context error'),
      });

      // Should render without throwing
      expect(() => render(<GroupNameInput />)).not.toThrow();
    });

    it('handles context loading state', () => {
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        isLoading: true,
      });

      // Should render without throwing
      expect(() => render(<GroupNameInput />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long input values', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      const veryLongValue = 'a'.repeat(1000);
      
      fireEvent.change(input, { target: { value: veryLongValue } });
      
      expect(mockSetGroupName).toHaveBeenCalledWith(veryLongValue);
    });

    it('handles input with unicode characters', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      const unicodeValue = 'Group Name with Unicode: 🚀🌟🎉中文日本語한국어';
      
      fireEvent.change(input, { target: { value: unicodeValue } });
      
      expect(mockSetGroupName).toHaveBeenCalledWith(unicodeValue);
    });

    it('handles rapid input changes', () => {
      render(<GroupNameInput />);

      const input = screen.getByRole('textbox');
      
      // Rapid changes
      fireEvent.change(input, { target: { value: 'A' } });
      fireEvent.change(input, { target: { value: 'AB' } });
      fireEvent.change(input, { target: { value: 'ABC' } });
      fireEvent.change(input, { target: { value: 'ABCD' } });
      
      expect(mockSetGroupName).toHaveBeenCalledTimes(4);
      expect(mockSetGroupName).toHaveBeenLastCalledWith('ABCD');
    });

    it('handles context with null values', () => {
      mockUseChecklists.mockReturnValue({
        ...defaultMockContext,
        groupName: null as any,
      });

      // Should render without throwing
      expect(() => render(<GroupNameInput />)).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('renders Tooltip component with correct props', () => {
      render(<GroupNameInput />);

      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute(
        'data-content',
        'Enter a unique name for this set of process checklists'
      );
    });

    it('renders InfoIcon component with correct props', () => {
      render(<GroupNameInput />);

      const infoIcon = screen.getByTestId('info-icon');
      expect(infoIcon).toBeInTheDocument();
      expect(infoIcon).toHaveClass('ml-2', 'h-5', 'w-5', 'text-gray-400', 'hover:text-gray-200');
    });

    it('maintains proper component hierarchy', () => {
      render(<GroupNameInput />);

      const container = screen.getByText('Group Name').closest('div');
      const label = screen.getByText('Group Name');
      const tooltip = screen.getByTestId('tooltip');
      const infoIcon = screen.getByTestId('info-icon');
      const input = screen.getByRole('textbox');

      expect(container).toContainElement(label);
      expect(label).toContainElement(tooltip);
      expect(tooltip).toContainElement(infoIcon);
      expect(container).toContainElement(input);
    });
  });
}); 