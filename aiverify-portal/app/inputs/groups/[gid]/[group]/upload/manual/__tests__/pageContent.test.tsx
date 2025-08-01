import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ChecklistsPageContent from '../pageContent';

// Enable fake timers to prevent infinite loops with waitFor
jest.useFakeTimers();

// Define the InputBlockGroup type locally to match the original file
interface InputBlockGroup {
  gid: string;
  groupName: string;
  inputBlocks: any[];
  data: any;
}

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock all components with simple implementations
jest.mock('@/app/inputs/groups/[gid]/[group]/components/LayoutHeader', () => {
  return function MockLayoutHeader({ projectId, onBack }: any) {
    return (
      <div data-testid="layout-header">
        <button onClick={onBack} data-testid="back-button">
          Back
        </button>
        <span data-testid="project-id">{projectId || 'no-project'}</span>
      </div>
    );
  };
});

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/manual/components/GroupNameInput', () => ({
  GroupNameInput: function MockGroupNameInput() {
    return <div data-testid="group-name-input">Group Name Input</div>;
  },
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/manual/components/Tooltip', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/utils/icons', () => ({
  InfoIcon: ({ className }: { className: string }) => (
    <div data-testid="info-icon" className={className}>
      Info
    </div>
  ),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/[groupId]/utils/icons', () => ({
  WarningCircleIcon: ({ className }: { className: string }) => (
    <div data-testid="warning-circle-icon" className={className}>
      Warning
    </div>
  ),
  CheckCircleIcon: ({ className }: { className: string }) => (
    <div data-testid="check-circle-icon" className={className}>
      Check
    </div>
  ),
}));

jest.mock('@/lib/components/card/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/manual/components/ProgressSidebar', () => {
  return function MockProgressBar({ group }: any) {
    return (
      <div data-testid="progress-bar">
        Progress for {group.groupName}
      </div>
    );
  };
});

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/manual/components/GroupDetail', () => {
  return function MockInputBlockGroupDetail({ group }: any) {
    return (
      <div data-testid="group-detail">
        Detail for {group.groupName}
      </div>
    );
  };
});

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/manual/components/SplitPane', () => {
  return function MockSplitPane({ leftPane, rightPane }: any) {
    return (
      <div data-testid="split-pane">
        <div data-testid="left-pane">{leftPane}</div>
        <div data-testid="right-pane">{rightPane}</div>
      </div>
    );
  };
});

jest.mock('@/app/inputs/utils/icons', () => ({
  ChevronLeftIcon: ({ size, color, onClick }: any) => (
    <div data-testid="chevron-left" onClick={onClick} style={{ width: size, height: size, color }}>
      ChevronLeft
    </div>
  ),
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: ({ heading, onCloseIconClick, primaryBtnLabel, secondaryBtnLabel, onPrimaryBtnClick, onSecondaryBtnClick, enableScreenOverlay, children }: any) => (
    <div data-testid="modal" data-heading={heading}>
      <div data-testid="modal-content">{children}</div>
      <button data-testid="close-button" onClick={onCloseIconClick}>
        Close
      </button>
      {primaryBtnLabel && (
        <button data-testid="primary-button" onClick={onPrimaryBtnClick}>
          {primaryBtnLabel}
        </button>
      )}
      {secondaryBtnLabel && (
        <button data-testid="secondary-button" onClick={onSecondaryBtnClick}>
          {secondaryBtnLabel}
        </button>
      )}
    </div>
  ),
}));

// Mock context hooks
jest.mock('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext', () => ({
  useChecklists: jest.fn(),
}));

jest.mock('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission', () => ({
  useInputBlockGroupSubmission: jest.fn(),
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

// Mock document events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});
Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
Object.defineProperty(global, 'setTimeout', {
  value: mockSetTimeout,
  writable: true,
});
Object.defineProperty(global, 'clearTimeout', {
  value: mockClearTimeout,
  writable: true,
});

describe('pageContent.tsx', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams();

  const mockGroup: InputBlockGroup = {
    gid: 'test.gid',
    groupName: 'Test Group',
    inputBlocks: [],
    data: {},
  };

  const mockUseChecklists = {
    checkForExistingData: jest.fn(),
    clearAllChecklists: jest.fn(),
    clearGroupName: jest.fn(),
    isLoading: false,
    error: null,
    groupName: 'Test Group Name',
    checklists: [
      {
        cid: 'test-cid-1',
        name: 'Test Checklist 1',
        data: { field1: 'value1' },
        group: 'test-group',
      },
      {
        cid: 'test-cid-2',
        name: 'Test Checklist 2',
        data: { field2: 'value2' },
        group: 'test-group',
      },
    ],
  };

  const mockUseInputBlockGroupSubmission = {
    submitInputBlockGroup: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockImplementation(() => {});
    mockSessionStorage.removeItem.mockImplementation(() => {});
    mockSetTimeout.mockReturnValue(123);
    mockClearTimeout.mockImplementation(() => {});
    mockAddEventListener.mockImplementation(() => {});
    mockRemoveEventListener.mockImplementation(() => {});

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  // Simple test to check if component can be rendered
  it('should render basic component structure', () => {
    const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
    useChecklists.mockReturnValue(mockUseChecklists);
    
    const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
    useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

    render(<ChecklistsPageContent group={mockGroup} />);

    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
    expect(screen.getByText('Add New Test Group')).toBeInTheDocument();
    expect(screen.getByTestId('group-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('group-detail')).toBeInTheDocument();
    expect(screen.getByText('Save All Changes')).toBeInTheDocument();
  });

  describe('ErrorMessage Component', () => {
    it('should render null when error is null', () => {
      // We need to test ErrorMessage through the main component since it's not exported
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        error: null,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);
      
      // ErrorMessage should not be visible when error is null
      expect(screen.queryByText('Validation Error:')).not.toBeInTheDocument();
    });

    it('should render validation errors (422)', async () => {
      const validationError = {
        message: 'Validation Error',
        statusCode: 422,
        details: [
          {
            type: 'validation_error',
            loc: ['field1'],
            msg: 'Field is required',
            input: 'test',
          },
          {
            type: 'validation_error',
            loc: ['field2'],
            msg: 'Invalid format',
            input: 'test2',
          },
        ],
      };
      
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(validationError);

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByText('Validation Error:')).toBeInTheDocument();
      expect(screen.getByText('Field is required (at field1)')).toBeInTheDocument();
      expect(screen.getByText('Invalid format (at field2)')).toBeInTheDocument();
    });

    it('should render duplicate checklist error (500)', async () => {
      const duplicateError = {
        message: "group 'TestGroup' already exists",
        statusCode: 500,
      };
      
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(duplicateError);

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByText(/`TestGroup` already exists/)).toBeInTheDocument();
      expect(screen.getByText(/Please modify the group name and try again/)).toBeInTheDocument();
    });

    it('should render default error message', async () => {
      const defaultError = {
        message: 'Something went wrong',
        details: 'Additional error details',
      };
      
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(defaultError);

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Additional error details')).toBeInTheDocument();
    });

    it('should render error without details', async () => {
      const errorWithoutDetails = {
        message: 'Simple error',
      };
      
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(errorWithoutDetails);

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByText('Simple error')).toBeInTheDocument();
    });

    it('should render error with non-string details', async () => {
      const errorWithNonStringDetails = {
        message: 'Error with non-string details',
        details: ['array', 'of', 'strings'],
      };
      
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(errorWithNonStringDetails);

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByText('Error with non-string details')).toBeInTheDocument();
      // Should not render details since it's not a string
      expect(screen.queryByText('array')).not.toBeInTheDocument();
    });

    it('should render error with unknown group name when regex match fails', async () => {
      const duplicateErrorWithUnknownGroup = {
        message: "group already exists but with different format",
        statusCode: 500,
      };
      
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(duplicateErrorWithUnknownGroup);

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByText(/`Unknown group` already exists/)).toBeInTheDocument();
    });
  });

  describe('useInactivityCheck Hook', () => {
    it('should set up inactivity timer on upload path', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 10 * 60 * 1000);
      expect(mockAddEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('should not set up timer on non-upload path', () => {
      (usePathname as jest.Mock).mockReturnValue('/some/other/path');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(mockSetTimeout).not.toHaveBeenCalled();
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });

    it('should show modal when inactivity timeout is reached', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastActiveTime') return (Date.now() - 11 * 60 * 1000).toString();
        if (key === 'continueModalShown') return null;
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Continue Previous Work?');
    });

    it('should show modal when navigating from non-upload to upload path with existing data', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastPath') return '/inputs/groups';
        if (key === 'checklistData') return JSON.stringify({ checklists: [] });
        if (key === 'continueModalShown') return null;
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should not show modal when modal was already shown', () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'continueModalShown') return 'true';
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should not show modal when existing data exists but modal was already shown', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastPath') return '/inputs/groups';
        if (key === 'checklistData') return JSON.stringify({ checklists: [] });
        if (key === 'continueModalShown') return 'true';
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should not show modal when inactivity timeout is reached but modal was already shown', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastActiveTime') return (Date.now() - 11 * 60 * 1000).toString();
        if (key === 'continueModalShown') return 'true';
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should not show modal when inactivity timeout is reached but time difference is less than timeout', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastActiveTime') return (Date.now() - 5 * 60 * 1000).toString(); // 5 minutes ago
        if (key === 'continueModalShown') return null;
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should handle timeout callback when not on upload path', () => {
      (usePathname as jest.Mock).mockReturnValue('/some/other/path');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      // Get the timeout callback if it exists
      const timeoutCallback = mockSetTimeout.mock.calls[0]?.[0];
      
      if (timeoutCallback) {
        // Simulate timeout
        act(() => {
          timeoutCallback();
        });

        // Should not set modal shown since not on upload path
        expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith('continueModalShown', 'true');
      }
    });

    it('should handle resetInactivityTimer when timerRef.current is null', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      // Get the activity handler
      const activityHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];
      
      if (activityHandler) {
        // Clear the timeout mock to simulate timerRef.current being null
        mockClearTimeout.mockClear();
        
        // Simulate activity
        activityHandler();
        
        // Should still call clearTimeout even if timerRef.current is null
        expect(mockClearTimeout).toHaveBeenCalled();
        expect(mockSetTimeout).toHaveBeenCalled();
      }
    });
  });

  describe('ChecklistsPageContent Component', () => {
    beforeEach(() => {
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);
    });

    it('should render with project flow', () => {
      mockSearchParams.get = jest.fn((key) => {
        if (key === 'projectId') return 'test-project-id';
        if (key === 'flow') return 'test-flow';
        return null;
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByText('Add New Test Group')).toBeInTheDocument();
      expect(screen.getByTestId('group-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('group-detail')).toBeInTheDocument();
      expect(screen.getByText('Save All Changes')).toBeInTheDocument();
    });

    it('should render without project flow', () => {
      mockSearchParams.get = jest.fn(() => null);

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByText('Add New Test Group')).toBeInTheDocument();
      expect(screen.getByText('Save All Changes')).toBeInTheDocument();
    });

    it('should show save error when group name is empty', async () => {
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        groupName: '',
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      fireEvent.click(saveButton);

      expect(screen.getByText('Please enter a group name before saving.')).toBeInTheDocument();
    });

    it('should save checklists successfully', async () => {
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockResolvedValue({});

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(mockUseInputBlockGroupSubmission.submitInputBlockGroup).toHaveBeenCalledTimes(2);
      expect(mockUseChecklists.clearAllChecklists).toHaveBeenCalled();
      expect(mockUseChecklists.clearGroupName).toHaveBeenCalled();

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Checklists saved successfully')).toBeInTheDocument();
    });

    it('should handle save error', async () => {
      const saveError = {
        message: 'Save failed',
        statusCode: 500,
      };
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(saveError);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    it('should handle back navigation for project flow', () => {
      mockSearchParams.get = jest.fn((key) => {
        if (key === 'projectId') return 'test-project-id';
        if (key === 'flow') return 'test-flow';
        return null;
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const backButton = screen.getByTestId('chevron-left');
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/inputs/groups/upload?flow=test-flow&projectId=test-project-id');
    });

    it('should handle back navigation for non-project flow', () => {
      mockSearchParams.get = jest.fn(() => null);

      render(<ChecklistsPageContent group={mockGroup} />);

      const backButton = screen.getByTestId('chevron-left');
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/inputs/groups');
    });

    it('should handle project back navigation', () => {
      mockSearchParams.get = jest.fn((key) => {
        if (key === 'projectId') return 'test-project-id';
        if (key === 'flow') return 'test-flow';
        return null;
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const projectBackButton = screen.getByTestId('back-button');
      fireEvent.click(projectBackButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/project/select_data?flow=test-flow&projectId=test-project-id');
    });

    it('should handle new set creation', async () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastPath') return '/inputs/groups';
        if (key === 'checklistData') return JSON.stringify({ checklists: [] });
        if (key === 'continueModalShown') return null;
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const continueModal = screen.getByTestId('modal');
      expect(continueModal).toBeInTheDocument();

      const startNewButton = screen.getByTestId('secondary-button');
      fireEvent.click(startNewButton);

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('checklistData');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('groupName');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('continueModalShown');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('lastActiveTime');
      expect(mockUseChecklists.clearAllChecklists).toHaveBeenCalled();
      expect(mockUseChecklists.clearGroupName).toHaveBeenCalled();
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it('should handle continue previous work', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastPath') return '/inputs/groups';
        if (key === 'checklistData') return JSON.stringify({ checklists: [] });
        if (key === 'continueModalShown') return null;
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const continueModal = screen.getByTestId('modal');
      expect(continueModal).toBeInTheDocument();

      const continueButton = screen.getByTestId('primary-button');
      fireEvent.click(continueButton);

      // Modal should be closed (no modal visible)
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should handle modal close icon click', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload');
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'lastPath') return '/inputs/groups';
        if (key === 'checklistData') return JSON.stringify({ checklists: [] });
        if (key === 'continueModalShown') return null;
        return null;
      });
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const continueModal = screen.getByTestId('modal');
      expect(continueModal).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      // Modal should be closed (no modal visible)
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should close modal and navigate for non-project flow', async () => {
      mockSearchParams.get = jest.fn(() => null);

      render(<ChecklistsPageContent group={mockGroup} />);

      // Trigger modal to show by saving successfully
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockResolvedValue({});
      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      // Close the modal
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/inputs/groups/');
    });

    it('should close modal without navigation for project flow', async () => {
      mockSearchParams.get = jest.fn((key) => {
        if (key === 'projectId') return 'test-project-id';
        if (key === 'flow') return 'test-flow';
        return null;
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      // Trigger modal to show by saving successfully
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockResolvedValue({});
      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      // Close the modal
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      // Should not navigate for project flow
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should show loading state when saving', () => {
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        isLoading: true,
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveClass('cursor-not-allowed', 'bg-primary-500', 'opacity-70');
    });

    it('should display context error', () => {
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        error: {
          message: 'Context error occurred',
          statusCode: 500,
        },
      });

      render(<ChecklistsPageContent group={mockGroup} />);

      expect(screen.getByText('Context error occurred')).toBeInTheDocument();
    });

    it('should handle activity events to reset inactivity timer', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      // Get the activity handler from the addEventListener calls
      const activityHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];
      
      if (activityHandler) {
        // Reset the mock calls to check if clearTimeout and setTimeout are called
        mockClearTimeout.mockClear();
        mockSetTimeout.mockClear();
        
        // Simulate activity by calling the handler directly
        activityHandler();
        
        expect(mockClearTimeout).toHaveBeenCalled();
        expect(mockSetTimeout).toHaveBeenCalled();
      }
    });

    it('should clean up event listeners on unmount', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      const { unmount } = render(<ChecklistsPageContent group={mockGroup} />);

      unmount();

      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });

    it('should handle cleanup when timerRef.current is set', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      const { unmount } = render(<ChecklistsPageContent group={mockGroup} />);

      // Ensure timer is set by triggering activity
      const activityHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];
      
      if (activityHandler) {
        activityHandler();
      }

      unmount();

      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });

    it('should handle inactivity timeout trigger', () => {
      (usePathname as jest.Mock).mockReturnValue('/inputs/groups/upload/manual');
      
      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue({
        ...mockUseChecklists,
        checkForExistingData: () => true,
      });
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      render(<ChecklistsPageContent group={mockGroup} />);

      // Get the timeout callback
      const timeoutCallback = mockSetTimeout.mock.calls[0][0];
      
      // Simulate timeout
      act(() => {
        timeoutCallback();
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('continueModalShown', 'true');
    });

    it('should handle pathname changes and cleanup', () => {
      (usePathname as jest.Mock).mockReturnValue('/some/other/path');

      const { useChecklists } = require('@/app/inputs/groups/[gid]/[group]/upload/context/ChecklistsContext');
      useChecklists.mockReturnValue(mockUseChecklists);
      
      const { useInputBlockGroupSubmission } = require('@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission');
      useInputBlockGroupSubmission.mockReturnValue(mockUseInputBlockGroupSubmission);

      const { unmount } = render(<ChecklistsPageContent group={mockGroup} />);

      // Unmount the component to trigger cleanup
      unmount();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('continueModalShown');
    });

    it('should handle save with validation error', async () => {
      const validationError = {
        message: 'Validation Error',
        statusCode: 422,
        details: [
          {
            type: 'validation_error',
            loc: ['field1'],
            msg: 'Field is required',
            input: 'test',
          },
        ],
      };
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(validationError);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Validation Error:')).toBeInTheDocument();
      expect(screen.getByText('Field is required (at field1)')).toBeInTheDocument();
    });

    it('should handle save with duplicate group error', async () => {
      const duplicateError = {
        message: "group 'TestGroup' already exists",
        statusCode: 500,
      };
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(duplicateError);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText(/`TestGroup` already exists/)).toBeInTheDocument();
    });

    it('should handle save with generic error', async () => {
      const genericError = {
        message: 'Network error',
        details: 'Connection failed',
      };
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(genericError);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should handle save with error without details', async () => {
      const simpleError = {
        message: 'Simple error',
      };
      mockUseInputBlockGroupSubmission.submitInputBlockGroup.mockRejectedValue(simpleError);

      render(<ChecklistsPageContent group={mockGroup} />);

      const saveButton = screen.getByText('Save All Changes');
      
      await act(async () => {
        fireEvent.click(saveButton);
        jest.runAllTimers();
      });

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Simple error')).toBeInTheDocument();
    });
  });
}); 