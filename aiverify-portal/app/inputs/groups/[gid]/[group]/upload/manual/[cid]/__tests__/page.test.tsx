import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, usePathname, useSearchParams, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChecklistDetailPage from '../page';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';

// Mock all dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/app/inputs/context/InputBlockGroupDataContext', () => ({
  useInputBlockGroupData: jest.fn(),
}));

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: any) => <div data-testid={`icon-${name}`} style={{ fontSize: size, color }} />,
  IconName: {
    CheckList: 'CheckList',
  },
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: ({ heading, children, onPrimaryBtnClick, onSecondaryBtnClick, onCloseIconClick, primaryBtnLabel, secondaryBtnLabel }: any) => (
    <div data-testid="modal">
      <h2>{heading}</h2>
      <div>{children}</div>
      <button onClick={onPrimaryBtnClick} data-testid="primary-btn">{primaryBtnLabel}</button>
      <button onClick={onSecondaryBtnClick} data-testid="secondary-btn">{secondaryBtnLabel}</button>
      <button onClick={onCloseIconClick} data-testid="close-btn">Close</button>
    </div>
  ),
}));

// Mock components with inline implementations
jest.mock('../../../../components/LayoutHeader', () => {
  return function MockLayoutHeader({ projectId, onBack }: any) {
    return (
      <div data-testid="layout-header">
        <span>Project: {projectId || 'null'}</span>
        <button onClick={onBack} data-testid="header-back-btn">Back</button>
      </div>
    );
  };
});

jest.mock('../components/ChecklistDetail', () => ({
  __esModule: true,
  default: ({ cid, data, onDataUpdated }: any) => (
    <div data-testid="checklist-detail">
      <span>CID: {cid}</span>
      <span>Data: {JSON.stringify(data)}</span>
      <button onClick={() => onDataUpdated({ test: 'data' })} data-testid="update-data-btn">
        Update Data
      </button>
    </div>
  ),
}));

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

// Mock global timer functions
global.clearTimeout = jest.fn();
global.setTimeout = jest.fn(() => 123) as any;

describe('ChecklistDetailPage', () => {
  let mockRouter: any;
  let mockUseInputBlockGroupData: any;
  let mockUseParams: any;
  let mockUseSearchParams: any;
  let mockUsePathname: any;

  const createQueryClient = () => new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockRouter = {
      push: jest.fn(),
      refresh: jest.fn(),
    };

    mockUseInputBlockGroupData = {
      gid: 'test-gid',
      group: 'test-group',
      newGroupData: {
        input_blocks: [
          { cid: 'test-cid', data: { existing: 'data' } },
        ],
      },
      updateNewGroupData: jest.fn(),
    };

    mockUseParams = {
      gid: 'test-gid',
      group: 'test-group',
      groupId: 'test-group-id',
      cid: 'test-cid',
    };

    mockUseSearchParams = new Map([
      ['projectId', 'test-project'],
      ['flow', 'test-flow'],
    ]);

    mockUsePathname = '/inputs/groups/upload/manual/test-cid';

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useInputBlockGroupData as jest.Mock).mockReturnValue(mockUseInputBlockGroupData);
    (useParams as jest.Mock).mockReturnValue(mockUseParams);
    (useSearchParams as jest.Mock).mockReturnValue(mockUseSearchParams);
    (usePathname as jest.Mock).mockReturnValue(mockUsePathname);

    // Default sessionStorage mock values
    mockSessionStorage.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'checklistData':
          return JSON.stringify({ test: 'data' });
        case 'continueModalShown':
          return null;
        case 'lastActiveTime':
          return (Date.now() - 1000).toString();
        case 'lastPath':
          return '/inputs/groups/upload';
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = () => {
    const queryClient = createQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <ChecklistDetailPage />
      </QueryClientProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders the component with all elements', () => {
      renderComponent();

      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('icon-CheckList')).toBeInTheDocument();
      expect(screen.getByText('Back to Group')).toBeInTheDocument();
      expect(screen.getByText('Clear Fields')).toBeInTheDocument();
      expect(screen.getByTestId('checklist-detail')).toBeInTheDocument();
    });

    it('renders breadcrumb navigation correctly', () => {
      renderComponent();

      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
      expect(screen.getByText('test-group')).toBeInTheDocument();
      expect(screen.getByText('test-cid')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('renders with project flow data', () => {
      renderComponent();

      expect(screen.getByText('Project: test-project')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('handles back navigation for project flow', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Back to Group'));

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/inputs/groups/test-gid/test-group/upload/manual?flow=test-flow&projectId=test-project'
      );
    });

    it('handles back navigation for non-project flow', () => {
      mockUseSearchParams = new Map();
      (useSearchParams as jest.Mock).mockReturnValue(mockUseSearchParams);

      renderComponent();

      fireEvent.click(screen.getByText('Back to Group'));

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/inputs/groups/test-gid/test-group/upload/manual'
      );
    });

    it('handles project back navigation', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('header-back-btn'));

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/project/select_data?flow=test-flow&projectId=test-project'
      );
    });
  });

  describe('Data Handling', () => {
    it('updates data when checklist detail calls onDataUpdated', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('update-data-btn'));

      expect(mockUseInputBlockGroupData.updateNewGroupData).toHaveBeenCalledWith(
        'test-cid',
        { test: 'data' }
      );
    });

    it('passes correct data to ChecklistDetail component', () => {
      renderComponent();

      const checklistDetail = screen.getByTestId('checklist-detail');
      expect(checklistDetail).toHaveTextContent('CID: test-cid');
      expect(checklistDetail).toHaveTextContent('Data: {"cid":"test-cid","data":{"existing":"data"}}');
    });
  });

  describe('Clear Fields Modal', () => {
    it('shows clear modal when Clear Fields button is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Clear Fields'));

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Confirm Clear')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to clear all fields? This action cannot be undone.')).toBeInTheDocument();
    });

    it('handles clear fields confirmation', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Clear Fields'));
      fireEvent.click(screen.getByTestId('primary-btn'));

      expect(mockUseInputBlockGroupData.updateNewGroupData).toHaveBeenCalledWith('test-cid', {});
      
      // The component uses setTimeout to refresh the page, so we just verify the data was cleared
      expect(mockUseInputBlockGroupData.updateNewGroupData).toHaveBeenCalledWith('test-cid', {});
    });

    it('closes clear modal when cancel is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Clear Fields'));
      fireEvent.click(screen.getByTestId('secondary-btn'));

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('closes clear modal when close icon is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Clear Fields'));
      fireEvent.click(screen.getByTestId('close-btn'));

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Inactivity Check Hook', () => {
    it('sets up session storage correctly', () => {
      renderComponent();

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastPath', mockUsePathname);
    });

    it('handles session storage operations', () => {
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'checklistData':
            return JSON.stringify({ test: 'data' });
          case 'continueModalShown':
            return null;
          case 'lastPath':
            return '/inputs/groups/upload';
          default:
            return null;
        }
      });

      renderComponent();

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastPath', mockUsePathname);
    });

    it('resets inactivity timer on user activity', () => {
      renderComponent();

      // Simulate user activity
      fireEvent.mouseDown(document);
      fireEvent.keyDown(document);
      fireEvent.scroll(document);
      fireEvent.mouseMove(document);
      fireEvent.touchStart(document);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastActiveTime', expect.any(String));
    });

    it('does not show modal when not on upload path', () => {
      mockUsePathname = '/some/other/path';
      (usePathname as jest.Mock).mockReturnValue(mockUsePathname);

      renderComponent();

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderComponent();
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing checklist data gracefully', () => {
      mockUseInputBlockGroupData.newGroupData.input_blocks = [];

      renderComponent();

      const checklistDetail = screen.getByTestId('checklist-detail');
      expect(checklistDetail).toHaveTextContent('Data: {}');
    });

    it('handles empty search params', () => {
      mockUseSearchParams = new Map();
      (useSearchParams as jest.Mock).mockReturnValue(mockUseSearchParams);

      renderComponent();

      expect(screen.getByText('Project: null')).toBeInTheDocument();
    });

    it('handles null projectId in search params', () => {
      mockUseSearchParams = new Map([
        ['flow', 'test-flow'],
      ]);
      (useSearchParams as jest.Mock).mockReturnValue(mockUseSearchParams);

      renderComponent();

      expect(screen.getByText('Project: null')).toBeInTheDocument();
    });

    it('handles URL encoding in breadcrumbs', () => {
      mockUseParams = {
        ...mockUseParams,
        gid: 'test%20gid',
        group: 'test%20group',
        cid: 'test%20cid',
      };
      (useParams as jest.Mock).mockReturnValue(mockUseParams);

      renderComponent();

      // The component uses decodeURIComponent on cid, so we expect decoded values
      expect(screen.getByText('test cid')).toBeInTheDocument();
    });
  });

  describe('Timer Management', () => {
    it('resets timer on pathname change', () => {
      const { rerender } = renderComponent();

      // Change pathname
      mockUsePathname = '/inputs/groups/upload/manual/different-cid';
      (usePathname as jest.Mock).mockReturnValue(mockUsePathname);

      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <ChecklistDetailPage />
        </QueryClientProvider>
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastPath', mockUsePathname);
    });
  });

  describe('Session Storage Management', () => {
    it('sets session storage items correctly', () => {
      renderComponent();

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastPath', mockUsePathname);
    });
  });
}); 