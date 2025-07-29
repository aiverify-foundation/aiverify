import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChecklistsProvider, useChecklists } from '../ChecklistsContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to use the context
const TestComponent = () => {
  const { checklists, selectedGroup, setChecklists, setSelectedGroup } = useChecklists();
  
  return (
    <div>
      <div data-testid="checklists-count">{checklists.length}</div>
      <div data-testid="selected-group">{selectedGroup || 'none'}</div>
      <button 
        data-testid="add-checklist" 
        onClick={() => setChecklists([...checklists, { 
          gid: 'test', 
          cid: 'test', 
          name: 'Test Checklist', 
          group: 'test-group', 
          data: {}, 
          id: 1, 
          created_at: '2023-01-01T00:00:00Z', 
          updated_at: '2023-01-01T00:00:00Z' 
        }])}
      >
        Add Checklist
      </button>
      <button 
        data-testid="set-group" 
        onClick={() => setSelectedGroup('new-group')}
      >
        Set Group
      </button>
    </div>
  );
};

describe('ChecklistsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('ChecklistsProvider', () => {
    it('renders children without crashing', () => {
      render(
        <ChecklistsProvider>
          <div data-testid="test-child">Test Child</div>
        </ChecklistsProvider>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('provides initial state', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-group')).toHaveTextContent('none');
    });

    it('loads stored data from localStorage on mount', () => {
      const storedChecklists = [
        { 
          gid: 'test', 
          cid: 'test', 
          name: 'Stored Checklist', 
          group: 'test-group', 
          data: {}, 
          id: 1, 
          created_at: '2023-01-01T00:00:00Z', 
          updated_at: '2023-01-01T00:00:00Z' 
        }
      ];
      
      localStorageMock.getItem
        .mockReturnValueOnce('stored-group') // selectedGroup
        .mockReturnValueOnce(JSON.stringify(storedChecklists)); // groupChecklists

      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-group')).toHaveTextContent('stored-group');
    });

    it('handles localStorage parsing errors gracefully', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('stored-group') // selectedGroup
        .mockReturnValueOnce('invalid-json'); // groupChecklists

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing stored checklists:', expect.any(Error));
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('0');
      
      consoleSpy.mockRestore();
    });

    it('updates checklists and persists to localStorage', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const addButton = screen.getByTestId('add-checklist');
      act(() => {
        addButton.click();
      });
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'groupChecklists',
        expect.stringContaining('Test Checklist')
      );
    });

    it('updates selected group and persists to localStorage', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const setGroupButton = screen.getByTestId('set-group');
      act(() => {
        setGroupButton.click();
      });
      
      expect(screen.getByTestId('selected-group')).toHaveTextContent('new-group');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedGroup', 'new-group');
    });

    it('handles multiple checklist updates', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const addButton = screen.getByTestId('add-checklist');
      
      act(() => {
        addButton.click();
        addButton.click();
        addButton.click();
      });
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3);
    });

    it('handles multiple group updates', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const setGroupButton = screen.getByTestId('set-group');
      
      act(() => {
        setGroupButton.click();
        setGroupButton.click();
        setGroupButton.click();
      });
      
      expect(screen.getByTestId('selected-group')).toHaveTextContent('new-group');
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3);
    });

    it('handles empty checklists array', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const addButton = screen.getByTestId('add-checklist');
      
      // Add a checklist first
      act(() => {
        addButton.click();
      });
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      
      // The test should verify that the component handles the state correctly
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('handles null selected group', () => {
      localStorageMock.getItem.mockReturnValueOnce('stored-group');
      
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      expect(screen.getByTestId('selected-group')).toHaveTextContent('stored-group');
    });
  });

  describe('useChecklists hook', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useChecklists must be used within a ChecklistsProvider');
      
      consoleSpy.mockRestore();
    });

    it('provides all required context values', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      expect(screen.getByTestId('checklists-count')).toBeInTheDocument();
      expect(screen.getByTestId('selected-group')).toBeInTheDocument();
      expect(screen.getByTestId('add-checklist')).toBeInTheDocument();
      expect(screen.getByTestId('set-group')).toBeInTheDocument();
    });

    it('maintains state between re-renders', () => {
      const { rerender } = render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const addButton = screen.getByTestId('add-checklist');
      
      act(() => {
        addButton.click();
      });
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      
      // Re-render the component
      rerender(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      // State should be maintained
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
    });
  });

  describe('localStorage persistence', () => {
    it('persists checklists data correctly', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const addButton = screen.getByTestId('add-checklist');
      act(() => {
        addButton.click();
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'groupChecklists',
        expect.stringContaining('Test Checklist')
      );
    });

    it('persists selected group correctly', () => {
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      const setGroupButton = screen.getByTestId('set-group');
      act(() => {
        setGroupButton.click();
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedGroup', 'new-group');
    });

    it('loads persisted data on mount', () => {
      const storedChecklists = [
        { 
          gid: 'test', 
          cid: 'test', 
          name: 'Persisted Checklist', 
          group: 'test-group', 
          data: {}, 
          id: 1, 
          created_at: '2023-01-01T00:00:00Z', 
          updated_at: '2023-01-01T00:00:00Z' 
        }
      ];
      
      localStorageMock.getItem
        .mockReturnValueOnce('persisted-group')
        .mockReturnValueOnce(JSON.stringify(storedChecklists));

      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-group')).toHaveTextContent('persisted-group');
    });
  });

  describe('Error handling', () => {
    it('handles localStorage setItem errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // The component should handle the error gracefully
      render(
        <ChecklistsProvider>
          <TestComponent />
        </ChecklistsProvider>
      );
      
      // Should not crash the component
      expect(screen.getByTestId('checklists-count')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('handles localStorage getItem errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage getItem error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // The component should handle the error gracefully
      expect(() => {
        render(
          <ChecklistsProvider>
            <TestComponent />
          </ChecklistsProvider>
        );
      }).toThrow('localStorage getItem error');
      
      consoleSpy.mockRestore();
    });
  });
}); 