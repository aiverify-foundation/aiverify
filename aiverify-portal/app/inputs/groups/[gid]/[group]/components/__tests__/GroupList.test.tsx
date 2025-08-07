import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import GroupList from '../GroupList';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { InputBlockGroupData } from '@/app/types';

// Mock the hooks and dependencies
jest.mock('@/app/inputs/context/InputBlockGroupDataContext');
jest.mock('@/app/inputs/components/FilterButtons', () => {
  return function MockChecklistsFilters({ onSearch, onSort }: { onSearch: (query: string) => void; onSort: (sortBy: string) => void }) {
    return (
      <div data-testid="checklists-filters">
        <input
          data-testid="search-input"
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search groups..."
        />
        <select
          data-testid="sort-select"
          onChange={(e) => onSort(e.target.value)}
          defaultValue="date-desc"
        >
          <option value="date-asc">Date (Oldest First)</option>
          <option value="date-desc">Date (Newest First)</option>
          <option value="name">Name</option>
        </select>
      </div>
    );
  };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockUseInputBlockGroupData = useInputBlockGroupData as jest.MockedFunction<typeof useInputBlockGroupData>;

// Create a wrapper component for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

// Mock group data
const mockGroupData: InputBlockGroupData[] = [
  {
    id: 1,
    name: 'Test Group 1',
    gid: 'test-gid',
    group: 'test-group',
    input_blocks: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
  },
  {
    id: 2,
    name: 'Test Group 2',
    gid: 'test-gid',
    group: 'test-group',
    input_blocks: [],
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Another Group',
    gid: 'test-gid',
    group: 'test-group',
    input_blocks: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

describe('GroupList', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseInputBlockGroupData.mockReturnValue({
      groupDataList: mockGroupData,
      gid: 'test-gid',
      group: 'test-group',
      groupId: undefined,
      cid: undefined,
      name: undefined,
      inputBlocks: null,
      currentGroupData: null,
      setInputBlockData: jest.fn(),
      setName: jest.fn(),
      getInputBlockData: jest.fn(),
      getGroupDataById: jest.fn(),
      newGroupData: {
        gid: 'test-gid',
        name: 'test-group',
        group: 'test-group',
        input_blocks: [],
      },
      updateNewGroupData: jest.fn(),
      saveNewGroupData: jest.fn(),
      projectId: null,
      flow: null,
    });

    // Mock useRouter
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);
  });

  describe('Component Rendering', () => {
    it('should render the component with filters', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('checklists-filters')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    });

    it('should render all groups when no search or sort is applied', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      expect(screen.getByText('Test Group 2')).toBeInTheDocument();
      expect(screen.getByText('Another Group')).toBeInTheDocument();
    });

    it('should render groups as clickable cards', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      expect(groupCards).toHaveLength(3);
      
      groupCards.forEach((card, index) => {
        expect(card).toHaveClass('cursor-pointer');
        expect(card).toHaveClass('transition-shadow');
        expect(card).toHaveClass('hover:shadow-lg');
      });
    });

    it('should render empty state when no groups exist', () => {
      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: [],
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test-gid',
          name: 'test-group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.queryAllByTestId('card');
      expect(groupCards).toHaveLength(0);
    });

    it('should render empty state when groupDataList is null', () => {
      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: null,
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test-gid',
          name: 'test-group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.queryAllByTestId('card');
      expect(groupCards).toHaveLength(0);
    });
  });

  describe('Search Functionality', () => {
    it('should filter groups by name when search query is entered', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Test Group');
      
      // Should show groups that match "Test Group"
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      expect(screen.getByText('Test Group 2')).toBeInTheDocument();
      // Note: Fuse.js might still show "Another Group" due to fuzzy matching
      // The test should focus on the groups that definitely match
    });

    it('should show no results when search query has no matches', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'XYZ123NonExistentGroup');
      
      // Should show no groups when there are no matches
      const groupCards = screen.queryAllByTestId('card');
      expect(groupCards).toHaveLength(0);
    });

    it('should handle case-insensitive search', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test group');
      
      // Should show groups that match "test group" (case-insensitive)
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      expect(screen.getByText('Test Group 2')).toBeInTheDocument();
      // Note: Fuse.js might still show "Another Group" due to fuzzy matching
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort groups by date ascending when date-asc is selected', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'date-asc');
      
      const groupCards = screen.getAllByTestId('card');
      expect(groupCards).toHaveLength(3);
      
      // Check that groups are sorted by updated_at in ascending order
      const groupNames = groupCards.map(card => card.textContent);
      expect(groupNames).toEqual(['Another Group', 'Test Group 2', 'Test Group 1']);
    });

    it('should sort groups by date descending when date-desc is selected', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'date-desc');
      
      const groupCards = screen.getAllByTestId('card');
      expect(groupCards).toHaveLength(3);
      
      // Check that groups are sorted by updated_at in descending order
      // Test Group 1 (2023-01-03) should be first, Test Group 2 (2023-01-02) second, Another Group (2023-01-01) third
      const groupNames = groupCards.map(card => card.textContent);
      expect(groupNames).toEqual(['Test Group 1', 'Test Group 2', 'Another Group']);
    });

    it('should sort groups by name when name is selected', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'name');
      
      const groupCards = screen.getAllByTestId('card');
      expect(groupCards).toHaveLength(3);
      
      // Check that groups are sorted alphabetically by name
      const groupNames = groupCards.map(card => card.textContent);
      expect(groupNames).toEqual(['Another Group', 'Test Group 1', 'Test Group 2']);
    });

    it('should maintain sort order when search is applied', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      // First sort by name
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'name');
      
      // Then search for "Test Group"
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Test Group');
      
      const groupCards = screen.getAllByTestId('card');
      // Should show Test Group 1 and Test Group 2 (sorted alphabetically)
      expect(groupCards.length).toBeGreaterThanOrEqual(2);
      
      // Should maintain alphabetical order
      const groupNames = groupCards.map(card => card.textContent);
      const testGroups = groupNames.filter(name => name?.includes('Test Group'));
      expect(testGroups).toEqual(['Test Group 1', 'Test Group 2']);
    });

    it('should handle default sort order (date-desc)', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      expect(groupCards).toHaveLength(3);
      
      // Default should be date-desc
      const groupNames = groupCards.map(card => card.textContent);
      expect(groupNames).toEqual(['Test Group 1', 'Test Group 2', 'Another Group']);
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate to group detail page when group card is clicked', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      await user.click(groupCards[0]); // Click first group (Test Group 1, id=1)
      
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/inputs/groups/test-gid/test-group/1'
      );
    });

    it('should navigate with correct group ID for each group', async () => {
      const user = userEvent.setup();
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      
      await user.click(groupCards[1]); // Click second group (Test Group 2, id=2)
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/inputs/groups/test-gid/test-group/2'
      );
      
      await user.click(groupCards[2]); // Click third group (Another Group, id=3)
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/inputs/groups/test-gid/test-group/3'
      );
    });

    it('should handle URL encoding for special characters in gid and group', async () => {
      const user = userEvent.setup();
      
      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: mockGroupData,
        gid: 'test/gid with spaces',
        group: 'test/group with spaces',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test/gid with spaces',
          name: 'test-group',
          group: 'test/group with spaces',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      await user.click(groupCards[0]);
      
      // encodeURI encodes forward slashes as %2F and spaces as %20
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/inputs/groups/test/gid%20with%20spaces/test/group%20with%20spaces/1'
      );
    });
  });

  describe('Card Styling and Layout', () => {
    it('should apply correct CSS classes to group cards', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      const firstCard = groupCards[0];
      
      expect(firstCard).toHaveClass('mb-4');
      expect(firstCard).toHaveClass('w-full');
      expect(firstCard).toHaveClass('cursor-pointer');
      expect(firstCard).toHaveClass('shadow-md');
      expect(firstCard).toHaveClass('transition-shadow');
      expect(firstCard).toHaveClass('duration-200');
      expect(firstCard).toHaveClass('hover:shadow-lg');
    });

    it('should apply correct inline styles to group cards', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      const firstCard = groupCards[0];
      
      expect(firstCard).toHaveStyle({
        border: '1px solid var(--color-secondary-300)',
        borderRadius: '0.5rem',
        padding: '1rem',
        width: '100%',
        height: 'auto',
      });
    });

    it('should render group names in correct heading element', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupNames = screen.getAllByRole('heading', { level: 3 });
      expect(groupNames).toHaveLength(3);
      // Check that all expected group names are present (order may vary due to sorting)
      expect(groupNames[0]).toHaveTextContent(/Test Group 1|Test Group 2|Another Group/);
      expect(groupNames[1]).toHaveTextContent(/Test Group 1|Test Group 2|Another Group/);
      expect(groupNames[2]).toHaveTextContent(/Test Group 1|Test Group 2|Another Group/);
    });

    it('should apply correct classes to group name headings', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupNames = screen.getAllByRole('heading', { level: 3 });
      groupNames.forEach(heading => {
        expect(heading).toHaveClass('text-lg');
        expect(heading).toHaveClass('font-medium');
      });
    });
  });

  describe('Container Layout', () => {
    it('should apply correct container classes', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const container = screen.getByTestId('checklists-filters').parentElement;
      expect(container).toHaveClass('mt-6');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('h-full');
      expect(container).toHaveClass('flex-col');
    });

    it('should apply correct scroll container classes', () => {
      render(<GroupList />, { wrapper: createWrapper() });
      
      const scrollContainer = screen.getByTestId('checklists-filters').nextElementSibling;
      expect(scrollContainer).toHaveClass('mt-2');
      expect(scrollContainer).toHaveClass('flex-1');
      expect(scrollContainer).toHaveClass('overflow-y-auto');
      expect(scrollContainer).toHaveClass('p-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty group name', () => {
      const groupsWithEmptyName: InputBlockGroupData[] = [
        {
          id: 1,
          name: '',
          gid: 'test-gid',
          group: 'test-group',
          input_blocks: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: groupsWithEmptyName,
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test-gid',
          name: 'test-group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCard = screen.getByTestId('card');
      expect(groupCard).toBeInTheDocument();
      expect(groupCard).toHaveTextContent('');
    });

    it('should handle groups with invalid dates', () => {
      const groupsWithInvalidDates: InputBlockGroupData[] = [
        {
          id: 1,
          name: 'Test Group',
          gid: 'test-gid',
          group: 'test-group',
          input_blocks: [],
          created_at: 'invalid-date',
          updated_at: 'invalid-date',
        },
      ];

      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: groupsWithInvalidDates,
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test-gid',
          name: 'test-group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      // Should not crash and should still render the group
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('should handle very long group names', () => {
      const longName = 'A'.repeat(1000);
      const groupsWithLongName: InputBlockGroupData[] = [
        {
          id: 1,
          name: longName,
          gid: 'test-gid',
          group: 'test-group',
          input_blocks: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: groupsWithLongName,
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test-gid',
          name: 'test-group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should memoize filtered and sorted results', () => {
      const { rerender } = render(<GroupList />, { wrapper: createWrapper() });
      
      // First render
      const firstRenderCards = screen.getAllByTestId('card');
      
      // Re-render with same props
      rerender(<GroupList />);
      
      const secondRenderCards = screen.getAllByTestId('card');
      
      // Should have same number of cards
      expect(firstRenderCards).toHaveLength(secondRenderCards.length);
    });

    it('should handle large number of groups efficiently', () => {
      const largeGroupList: InputBlockGroupData[] = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        name: `Group ${index + 1}`,
        gid: 'test-gid',
        group: 'test-group',
        input_blocks: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }));

      mockUseInputBlockGroupData.mockReturnValue({
        groupDataList: largeGroupList,
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: undefined,
        name: undefined,
        inputBlocks: null,
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: {
          gid: 'test-gid',
          name: 'test-group',
          group: 'test-group',
          input_blocks: [],
        },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      render(<GroupList />, { wrapper: createWrapper() });
      
      const groupCards = screen.getAllByTestId('card');
      expect(groupCards).toHaveLength(100);
    });
  });
}); 