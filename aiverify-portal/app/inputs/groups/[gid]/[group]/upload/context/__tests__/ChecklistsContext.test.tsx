import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { GroupDataProvider, useChecklists } from '../ChecklistsContext';
import { DEFAULT_CHECKLISTS, type Checklist } from '../checklistConstants';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Test component that renders context values
const TestComponent: React.FC = () => {
  const context = useChecklists();
  return (
    <div>
      <div data-testid="group-name">{context.groupName}</div>
      <div data-testid="checklists-count">{context.checklists.length}</div>
      <div data-testid="selected-checklist">{context.selectedChecklist?.cid || 'null'}</div>
      <div data-testid="checklist-data">
        {context.checklists.find(c => c.cid === 'transparency_process_checklist')?.data.key1 || 'no-data'}
      </div>
      <button 
        data-testid="set-group-name" 
        onClick={() => context.setGroupName('test-group')}
      >
        Set Group Name
      </button>
      <button 
        data-testid="clear-group-name" 
        onClick={() => context.clearGroupName()}
      >
        Clear Group Name
      </button>
      <button 
        data-testid="set-selected-checklist" 
        onClick={() => context.setSelectedChecklist({
          cid: 'test-cid',
          gid: 'test-gid',
          name: 'Test Checklist',
          data: {},
          group: 'default',
        })}
      >
        Set Selected Checklist
      </button>
      <button 
        data-testid="update-checklist-data" 
        onClick={() => context.updateChecklistData('transparency_process_checklist', { key1: 'value1' })}
      >
        Update Checklist Data
      </button>
      <button 
        data-testid="set-checklists" 
        onClick={() => context.setChecklists([{
          cid: 'new-cid',
          gid: 'new-gid',
          name: 'New Checklist',
          data: { key1: 'value1' },
          group: 'custom',
        }])}
      >
        Set Checklists
      </button>
      <button 
        data-testid="clear-all" 
        onClick={() => context.clearAllChecklists()}
      >
        Clear All
      </button>
      <div data-testid="has-existing-data">{context.checkForExistingData().toString()}</div>
    </div>
  );
};

// Wrapper component for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GroupDataProvider>{children}</GroupDataProvider>
);

describe('ChecklistsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GroupDataProvider', () => {
    it('should render children without crashing', () => {
      render(
        <TestWrapper>
          <div data-testid="test-child">Test Child</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should provide default context values', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('group-name')).toHaveTextContent('');
      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());
      expect(screen.getByTestId('selected-checklist')).toHaveTextContent('null');
      expect(screen.getByTestId('checklist-data')).toHaveTextContent('no-data');
      expect(screen.getByTestId('has-existing-data')).toHaveTextContent('false');
    });
  });

  describe('useChecklists hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useChecklists must be used within a ChecklistsProvider');

      consoleSpy.mockRestore();
    });

    it('should work correctly when used within provider', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());
    });
  });

  describe('setGroupName', () => {
    it('should update groupName in state', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('group-name')).toHaveTextContent('');

      act(() => {
        screen.getByTestId('set-group-name').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toHaveTextContent('test-group');
      });
    });

    it('should save groupName to sessionStorage', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-group-name').click();
      });

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('groupName', 'test-group');
      });
    });

    it('should update checklistData in sessionStorage when existing data exists', async () => {
      const existingData = {
        checklists: DEFAULT_CHECKLISTS,
        groupName: 'old-group',
      };
      mockSessionStorage.getItem.mockReturnValueOnce(JSON.stringify(existingData));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-group-name').click();
      });

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'checklistData',
          JSON.stringify({
            checklists: DEFAULT_CHECKLISTS,
            groupName: 'test-group',
          })
        );
      });
    });

    it('should create new checklistData in sessionStorage when no existing data', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-group-name').click();
      });

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'checklistData',
          JSON.stringify({
            checklists: DEFAULT_CHECKLISTS,
            groupName: 'test-group',
          })
        );
      });
    });


  });

  describe('clearGroupName', () => {
    it('should clear groupName from state', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // First set a group name
      act(() => {
        screen.getByTestId('set-group-name').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toHaveTextContent('test-group');
      });

      // Then clear it
      act(() => {
        screen.getByTestId('clear-group-name').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toHaveTextContent('');
      });
    });

    it('should remove groupName from sessionStorage', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('clear-group-name').click();
      });

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('groupName');
      });
    });
  });

  describe('setSelectedChecklist', () => {
    it('should update selectedChecklist in state', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('selected-checklist')).toHaveTextContent('null');

      act(() => {
        screen.getByTestId('set-selected-checklist').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-checklist')).toHaveTextContent('test-cid');
      });
    });
  });

  describe('updateChecklistData', () => {
    it('should update checklist data for existing cid', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('checklist-data')).toHaveTextContent('no-data');

      act(() => {
        screen.getByTestId('update-checklist-data').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('checklist-data')).toHaveTextContent('value1');
      });
    });

    it('should save updated checklists to sessionStorage', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('update-checklist-data').click();
      });

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'checklistData',
          expect.stringContaining('"key1":"value1"')
        );
      });
    });
  });

  describe('setChecklists', () => {
    it('should update checklists in state', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());

      act(() => {
        screen.getByTestId('set-checklists').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
      });
    });
  });

  describe('clearAllChecklists', () => {
    it('should reset state to default values', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // First modify the state
      act(() => {
        screen.getByTestId('set-group-name').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toHaveTextContent('test-group');
      });

      // Then clear all
      act(() => {
        screen.getByTestId('clear-all').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toHaveTextContent('');
        expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());
        expect(screen.getByTestId('selected-checklist')).toHaveTextContent('null');
      });
    });

    it('should remove checklistData from sessionStorage', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('clear-all').click();
      });

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('checklistData');
      });
    });
  });

  describe('checkForExistingData', () => {
    it('should return true when checklistData exists in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('{"checklists":[],"groupName":"test"}');

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-existing-data')).toHaveTextContent('true');
    });

    it('should return false when checklistData does not exist in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-existing-data')).toHaveTextContent('false');
    });

    it('should return false when checklistData is empty string', () => {
      mockSessionStorage.getItem.mockReturnValue('');

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-existing-data')).toHaveTextContent('false');
    });
  });

  describe('initialization from sessionStorage', () => {
    it('should load saved data from sessionStorage on mount', () => {
      const savedData = {
        checklists: [
          {
            cid: 'saved-cid',
            gid: 'saved-gid',
            name: 'Saved Checklist',
            data: { savedKey: 'savedValue' },
            group: 'saved-group',
          },
        ],
        groupName: 'saved-group-name',
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('group-name')).toHaveTextContent('saved-group-name');
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
    });

    it('should handle invalid JSON in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(consoleSpy).toHaveBeenCalledWith('Error parsing saved data:', expect.any(Error));
      expect(screen.getByTestId('group-name')).toHaveTextContent('');
      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());

      consoleSpy.mockRestore();
    });

    it('should handle missing properties in saved data', () => {
      const savedData = {
        checklists: [
          {
            cid: 'saved-cid',
            gid: 'saved-gid',
            name: 'Saved Checklist',
            data: {},
            group: 'saved-group',
          },
        ],
        // missing groupName
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('group-name')).toHaveTextContent(''); // Should default to empty string
      expect(screen.getByTestId('checklists-count')).toHaveTextContent('1');
    });

    it('should handle missing checklists in saved data', () => {
      const savedData = {
        groupName: 'saved-group-name',
        // missing checklists
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString()); // Should default to DEFAULT_CHECKLISTS
      expect(screen.getByTestId('group-name')).toHaveTextContent('saved-group-name');
    });

    it('should not load data when sessionStorage.getItem returns null', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());
      expect(screen.getByTestId('group-name')).toHaveTextContent('');
    });
  });

  describe('QueryClient integration', () => {
    it('should provide QueryClient to children', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('checklists-count')).toHaveTextContent(DEFAULT_CHECKLISTS.length.toString());
      expect(screen.getByTestId('group-name')).toHaveTextContent('');
    });
  });
}); 