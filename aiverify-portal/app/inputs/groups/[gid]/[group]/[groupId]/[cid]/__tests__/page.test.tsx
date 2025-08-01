import { render, screen } from '@testing-library/react';
import ChecklistDetailPage from '../page';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';

// Mock the dependencies
jest.mock('@/app/inputs/context/InputBlockGroupDataContext');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
}));
jest.mock('../components/ChecklistDetail', () => {
  return function MockChecklistDetail({ cid, gid }: { cid: string; gid: string }) {
    return (
      <div data-testid="checklist-detail">
        <div data-testid="cid">{cid}</div>
        <div data-testid="gid">{gid}</div>
      </div>
    );
  };
});

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('ChecklistDetailPage', () => {
  const mockUseInputBlockGroupData = useInputBlockGroupData as jest.MockedFunction<typeof useInputBlockGroupData>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Early return scenarios', () => {
    it('should return null when groupId is missing', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: undefined,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      const result = render(<ChecklistDetailPage />);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Early return triggered - missing groupId or cid');
      expect(result.container.firstChild).toBeNull();
    });

    it('should return null when cid is missing', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: undefined,
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      const result = render(<ChecklistDetailPage />);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Early return triggered - missing groupId or cid');
      expect(result.container.firstChild).toBeNull();
    });

    it('should return null when both groupId and cid are missing', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: undefined,
        cid: undefined,
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      const result = render(<ChecklistDetailPage />);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Early return triggered - missing groupId or cid');
      expect(result.container.firstChild).toBeNull();
    });
  });

  describe('Successful rendering scenarios', () => {
    it('should render successfully with all required props', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('test-group')).toBeInTheDocument();
      expect(screen.getByText('Test Name')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByTestId('checklist-detail')).toBeInTheDocument();
      expect(screen.getByTestId('cid')).toHaveTextContent('test-cid');
      expect(screen.getByTestId('gid')).toHaveTextContent('test-gid');
    });

    it('should render with fallback name when name is not provided', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: undefined,
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(screen.getByText('123')).toBeInTheDocument(); // groupId as fallback
    });

    it('should render with empty name when name is empty string', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: '',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(screen.getByText('123')).toBeInTheDocument(); // groupId as fallback
    });
  });

  describe('Breadcrumb navigation', () => {
    it('should render breadcrumb navigation with correct links', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      const inputsLink = screen.getByText('Inputs');
      const groupLink = screen.getByText('test-group');
      const nameLink = screen.getByText('Test Name');

      expect(inputsLink).toHaveAttribute('href', '/inputs');
      expect(groupLink).toHaveAttribute('href', '/inputs/groups/test-gid/test-group');
      expect(nameLink).toHaveAttribute('href', '/inputs/groups/test-gid/test-group/123');
    });



    it('should render breadcrumb navigation when only flow is present in context', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: 'test-flow',
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      const inputsLink = screen.getByText('Inputs');
      const groupLink = screen.getByText('test-group');
      const nameLink = screen.getByText('Test Name');

      expect(inputsLink).toHaveAttribute('href', '/inputs');
      expect(groupLink).toHaveAttribute('href', '/inputs/groups/test-gid/test-group');
      expect(nameLink).toHaveAttribute('href', '/inputs/groups/test-gid/test-group/123');
    });

    it('should render breadcrumb navigation when only projectId is present in context', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: 'test-project',
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      const inputsLink = screen.getByText('Inputs');
      const groupLink = screen.getByText('test-group');
      const nameLink = screen.getByText('Test Name');

      expect(inputsLink).toHaveAttribute('href', '/inputs');
      expect(groupLink).toHaveAttribute('href', '/inputs/groups/test-gid/test-group');
      expect(nameLink).toHaveAttribute('href', '/inputs/groups/test-gid/test-group/123');
    });
  });

  describe('Component structure', () => {
    it('should render with QueryClientProvider wrapper', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(screen.getByTestId('checklist-detail')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should render with correct CSS classes and structure', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      const { container } = render(<ChecklistDetailPage />);

      // Assert
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.breadcrumbs')).toBeInTheDocument();
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
      expect(container.querySelector('.border')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
      expect(container.querySelector('.shadow-sm')).toBeInTheDocument();
    });
  });

  describe('Console logging', () => {
    it('should log component start message', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('ChecklistDetailPage component started');
    });

    it('should log context values', () => {
      // Arrange
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Context values:', { gid: 'test-gid', groupId: 123, cid: 'test-cid', group: 'test-group' });
    });

    it('should handle SSR scenario when window is undefined', () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;
      
      mockUseInputBlockGroupData.mockReturnValue({
        gid: 'test-gid',
        groupId: 123,
        cid: 'test-cid',
        group: 'test-group',
        name: 'Test Name',
        groupDataList: [],
        inputBlocks: [],
        currentGroupData: null,
        setInputBlockData: jest.fn(),
        setName: jest.fn(),
        getInputBlockData: jest.fn(),
        getGroupDataById: jest.fn(),
        newGroupData: { gid: 'test-gid', name: 'test-group', group: 'test-group', input_blocks: [] },
        updateNewGroupData: jest.fn(),
        saveNewGroupData: jest.fn(),
        projectId: null,
        flow: null,
      });

      // Act
      render(<ChecklistDetailPage />);

      // Assert
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('test-group')).toBeInTheDocument();
      expect(screen.getByText('Test Name')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();

      // Restore window
      global.window = originalWindow;
    });
  });
}); 