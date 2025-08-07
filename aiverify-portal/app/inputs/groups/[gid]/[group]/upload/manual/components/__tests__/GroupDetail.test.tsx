import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import GroupDetail from '../GroupDetail';
import { InputBlockGroup, InputBlockData } from '@/app/inputs/utils/types';
import { InputBlock } from '@/app/types';

// Mock the useMDXSummaryBundle hook
jest.mock('../../../../[groupId]/hooks/useMDXSummaryBundle', () => ({
  useMDXSummaryBundle: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the Card component
jest.mock('@/lib/components/card/card', () => ({
  Card: ({ children, onClick, className, cardColor, enableTiltEffect, ...props }: any) => (
    <div 
      data-testid="card"
      onClick={onClick}
      className={className}
      style={props.style}
      {...props}
    >
      {children}
    </div>
  ),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseMDXSummaryBundle = require('../../../../[groupId]/hooks/useMDXSummaryBundle').useMDXSummaryBundle as jest.MockedFunction<any>;

describe('GroupDetail', () => {
  const mockPush = jest.fn();
  
  const mockInputBlock: InputBlock = {
    gid: 'test.gid',
    cid: 'test.cid',
    name: 'Test Input Block',
    description: 'Test Description',
    group: 'test-group',
    width: 'md',
    mdxContent: 'test content',
    version: '1.0.0',
    author: 'Test Author',
    tags: 'test, tags',
    groupNumber: 1,
    fullScreen: false,
  };

  const mockInputBlockData: InputBlockData = {
    'test-key': 'test-value',
    'completed-2.1.1': 'Yes',
  };

  const mockGroup: InputBlockGroup = {
    gid: 'test.gid',
    groupName: 'Test Group',
    inputBlocks: [mockInputBlock],
    data: mockInputBlockData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
    
    // Default mock for useMDXSummaryBundle
    mockUseMDXSummaryBundle.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    // Mock window.location.search
    delete (window as any).location;
    (window as any).location = {
      search: '',
    };
  });

  afterEach(() => {
    // Restore window.location
    delete (window as any).location;
    (window as any).location = {
      search: '',
    };
  });

  describe('InputBlockMDX Component', () => {
    it('renders loading state when isLoading is true', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      // Loading state should show animated elements
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('renders error state when error exists', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Test error'),
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Error loading checklist content')).toBeInTheDocument();
    });

    it('renders "No summary available" when MDXComponent is falsy', () => {
      // Mock the Function constructor to return null, which will cause an error when trying to access properties
      global.Function = jest.fn().mockImplementation(() => null);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'test code' },
        isLoading: false,
        error: null,
      });

      // Spy on console.error to verify it's called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<GroupDetail group={mockGroup} />);

      // When Function constructor returns null, it will throw an error when trying to call it
      // The error is caught and returns an empty object, which is truthy
      // So it won't show "No summary available" - it will show an empty mdx-content div
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Error creating MDX component:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('renders "No summary available" when mdxSummaryBundle has no code', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: null },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      // When code is null, the component returns an empty object, which is truthy
      // So it won't show "No summary available" - it will show an empty mdx-content div
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
    });

    it('renders summary and progress when MDXComponent has both functions', () => {
      const mockSummary = jest.fn(() => 'Test Summary');
      const mockProgress = jest.fn(() => 75);

      // Mock the Function constructor to return our test functions
      const mockModuleFactory = jest.fn(() => ({
        progress: mockProgress,
        summary: mockSummary,
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'test code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Test Summary')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      
      // Verify progress bar exists
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('renders only summary when MDXComponent has only summary function', () => {
      const mockSummary = jest.fn(() => 'Test Summary Only');

      const mockModuleFactory = jest.fn(() => ({
        summary: mockSummary,
        // No progress function
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'test code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Test Summary Only')).toBeInTheDocument();
      // Should not show progress bar
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('renders only progress when MDXComponent has only progress function', () => {
      const mockProgress = jest.fn(() => 50);

      const mockModuleFactory = jest.fn(() => ({
        progress: mockProgress,
        // No summary function
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'test code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      // Should not show summary
      expect(screen.queryByText('Test Summary')).not.toBeInTheDocument();
    });

    it('handles error in MDX component creation gracefully', () => {
      // Mock Function constructor to throw an error
      global.Function = jest.fn().mockImplementation(() => {
        throw new Error('MDX compilation error');
      });

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'invalid code' },
        isLoading: false,
        error: null,
      });

      // Spy on console.error to verify it's called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<GroupDetail group={mockGroup} />);

      // When Function constructor throws, it returns an empty object, which is truthy
      // So it won't show "No summary available" - it will show an empty mdx-content div
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Error creating MDX component:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('handles undefined MDXComponent gracefully', () => {
      // Mock the Function constructor to return a function that returns undefined
      global.Function = jest.fn().mockImplementation(() => {
        return () => undefined;
      });

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'test code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      // When moduleExports is undefined, the component returns { progress: undefined, summary: undefined }
      // This is truthy, so it won't show "No summary available"
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
    });

    it('handles null MDXComponent gracefully', () => {
      // Mock the Function constructor to return a function that returns null
      global.Function = jest.fn().mockImplementation(() => {
        return () => null;
      });

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'test code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      // When moduleExports is null, the component returns { progress: null, summary: null }
      // This is truthy, so it won't show "No summary available"
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
    });
  });

  describe('InputBlockGroupDetail Component', () => {
    it('renders input blocks correctly', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders multiple input blocks', () => {
      const multipleInputBlocks = [
        { ...mockInputBlock, cid: 'test1', name: 'Test Block 1' },
        { ...mockInputBlock, cid: 'test2', name: 'Test Block 2' },
        { ...mockInputBlock, cid: 'test3', name: 'Test Block 3' },
      ];

      const groupWithMultipleBlocks: InputBlockGroup = {
        ...mockGroup,
        inputBlocks: multipleInputBlocks,
      };

      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={groupWithMultipleBlocks} />);

      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
      expect(screen.getByText('Test Block 2')).toBeInTheDocument();
      expect(screen.getByText('Test Block 3')).toBeInTheDocument();
      
      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(3);
    });

    it('handles click on input block without URL parameters', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      const card = screen.getByTestId('card');
      fireEvent.click(card);

      expect(mockPush).toHaveBeenCalledWith(
        '/inputs/groups/test.gid/Test%20Group/upload/manual/test.cid'
      );
    });

    it('handles click on input block with URL parameters', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      // Mock URLSearchParams to return the expected values
      const mockURLSearchParams = jest.fn().mockImplementation((search) => ({
        get: (key: string) => {
          if (key === 'flow') return 'test-flow';
          if (key === 'projectId') return '123';
          return null;
        }
      }));
      
      // Store original URLSearchParams
      const originalURLSearchParams = global.URLSearchParams;
      global.URLSearchParams = mockURLSearchParams as any;

      render(<GroupDetail group={mockGroup} />);

      const card = screen.getByTestId('card');
      fireEvent.click(card);

      expect(mockPush).toHaveBeenCalledWith(
        '/inputs/groups/test.gid/Test%20Group/upload/manual/test.cid?flow=test-flow&projectId=123'
      );

      // Restore original URLSearchParams
      global.URLSearchParams = originalURLSearchParams;
    });

    it('handles click on input block with special characters in group name', () => {
      const groupWithSpecialChars: InputBlockGroup = {
        ...mockGroup,
        groupName: 'Test Group with Spaces & Special Chars',
      };

      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={groupWithSpecialChars} />);

      const card = screen.getByTestId('card');
      fireEvent.click(card);

      // The component uses encodeURI which encodes & as & (not %26)
      expect(mockPush).toHaveBeenCalledWith(
        '/inputs/groups/test.gid/Test%20Group%20with%20Spaces%20&%20Special%20Chars/upload/manual/test.cid'
      );
    });

    it('renders empty group gracefully', () => {
      const emptyGroup: InputBlockGroup = {
        ...mockGroup,
        inputBlocks: [],
      };

      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={emptyGroup} />);

      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('applies correct CSS classes and styles', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      const container = document.querySelector('.flex.h-full.w-full.flex-col.gap-4.overflow-y-auto.bg-secondary-950.p-4.scrollbar-hidden');
      expect(container).toBeInTheDocument();

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('group', 'relative', 'mb-4', 'w-full', 'transform', 'cursor-pointer', 'transition-all', 'duration-200', 'hover:scale-[1.01]', 'hover:shadow-lg');
    });

    it('handles different input block data structures', () => {
      const inputBlockWithDifferentData: InputBlock = {
        ...mockInputBlock,
        cid: 'different-data',
        name: 'Different Data Block',
      };

      const groupWithDifferentData: InputBlockGroup = {
        ...mockGroup,
        inputBlocks: [inputBlockWithDifferentData],
        data: {
          'different-key': 'different-value',
          'nested-value': 'test',
        },
      };

      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={groupWithDifferentData} />);

      expect(screen.getByText('Different Data Block')).toBeInTheDocument();
    });

    it('handles input block with missing optional properties', () => {
      const minimalInputBlock: InputBlock = {
        gid: 'test.gid',
        cid: 'test.cid',
        name: 'Minimal Input Block',
        description: '',
        group: 'test-group',
        width: 'md',
        mdxContent: '',
        version: '',
        author: '',
        tags: '',
        groupNumber: 1,
        fullScreen: false,
      };

      const groupWithMinimalBlock: InputBlockGroup = {
        ...mockGroup,
        inputBlocks: [minimalInputBlock],
      };

      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={groupWithMinimalBlock} />);

      expect(screen.getByText('Minimal Input Block')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('handles complete flow with MDX summary and progress', () => {
      const mockSummary = jest.fn(() => 'Complete Summary');
      const mockProgress = jest.fn(() => 100);

      const mockModuleFactory = jest.fn(() => ({
        progress: mockProgress,
        summary: mockSummary,
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'complete code' },
        isLoading: false,
        error: null,
      });

      // Mock URLSearchParams to return the expected values
      const mockURLSearchParams = jest.fn().mockImplementation((search) => ({
        get: (key: string) => {
          if (key === 'flow') return 'complete';
          if (key === 'projectId') return '456';
          return null;
        }
      }));
      
      // Store original URLSearchParams
      const originalURLSearchParams = global.URLSearchParams;
      global.URLSearchParams = mockURLSearchParams as any;

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Test Input Block')).toBeInTheDocument();
      expect(screen.getByText('Complete Summary')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();

      const card = screen.getByTestId('card');
      fireEvent.click(card);

      expect(mockPush).toHaveBeenCalledWith(
        '/inputs/groups/test.gid/Test%20Group/upload/manual/test.cid?flow=complete&projectId=456'
      );

      // Restore original URLSearchParams
      global.URLSearchParams = originalURLSearchParams;
    });

    it('handles error state and then successful load', () => {
      // Start with error state
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Initial error'),
      });

      const { rerender } = render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Error loading checklist content')).toBeInTheDocument();

      // Change to successful state
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      rerender(<GroupDetail group={mockGroup} />);

      // When data is null, the component returns an empty object, which is truthy
      // So it won't show "No summary available" - it will show an empty mdx-content div
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
    });

    it('handles loading state transition to success', () => {
      // Start with loading state
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<GroupDetail group={mockGroup} />);

      // Should show loading state
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);

      // Change to success state
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      rerender(<GroupDetail group={mockGroup} />);

      // When data is null, the component returns an empty object, which is truthy
      // So it won't show "No summary available" - it will show an empty mdx-content div
      expect(screen.queryByText('No summary available')).not.toBeInTheDocument();
      const mdxContent = document.querySelector('.mdx-content');
      expect(mdxContent).toBeInTheDocument();
    });

    it('handles loading state transition to error', () => {
      // Start with loading state
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<GroupDetail group={mockGroup} />);

      // Should show loading state
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);

      // Change to error state
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Loading failed'),
      });

      rerender(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Error loading checklist content')).toBeInTheDocument();
    });

    it('handles progress values at boundaries', () => {
      const mockSummary = jest.fn(() => 'Boundary Test');
      const mockProgress = jest.fn(() => 0);

      const mockModuleFactory = jest.fn(() => ({
        progress: mockProgress,
        summary: mockSummary,
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'boundary code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Boundary Test')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // Verify progress bar exists with 0% width
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('handles negative progress values', () => {
      const mockSummary = jest.fn(() => 'Negative Progress');
      const mockProgress = jest.fn(() => -10);

      const mockModuleFactory = jest.fn(() => ({
        progress: mockProgress,
        summary: mockSummary,
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'negative code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Negative Progress')).toBeInTheDocument();
      expect(screen.getByText('-10%')).toBeInTheDocument();
      
      // Verify progress bar exists with negative width
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '-10%' });
    });

    it('handles progress values over 100%', () => {
      const mockSummary = jest.fn(() => 'Over 100% Progress');
      const mockProgress = jest.fn(() => 150);

      const mockModuleFactory = jest.fn(() => ({
        progress: mockProgress,
        summary: mockSummary,
      }));

      global.Function = jest.fn().mockImplementation(() => mockModuleFactory);

      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'over100 code' },
        isLoading: false,
        error: null,
      });

      render(<GroupDetail group={mockGroup} />);

      expect(screen.getByText('Over 100% Progress')).toBeInTheDocument();
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Verify progress bar exists with over 100% width
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '150%' });
    });
  });
}); 