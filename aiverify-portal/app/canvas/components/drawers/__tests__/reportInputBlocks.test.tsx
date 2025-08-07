import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportInputBlocksDrawer } from '../reportInputBlocks';
import { InputBlock } from '@/app/types';

// Mock the drawer components
jest.mock('@/lib/components/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer">{children}</div>,
  DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div data-testid="drawer-trigger">{children}</div>,
  DrawerContent: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="drawer-content" className={className}>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="drawer-header">{children}</div>,
  DrawerTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="drawer-title" className={className}>{children}</div>,
  DrawerDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="drawer-description" className={className}>{children}</div>,
  DrawerBody: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="drawer-body">{children}</div>,
  DrawerFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="drawer-footer" className={className}>{children}</div>,
  DrawerClose: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div data-testid="drawer-close">{children}</div>,
}));

// Mock the Button component
jest.mock('@/lib/components/TremurButton', () => ({
  Button: ({ children, variant, className, onClick }: { 
    children: React.ReactNode; 
    variant?: string; 
    className?: string;
    onClick?: () => void;
  }) => (
    <button 
      data-testid="button" 
      data-variant={variant} 
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

// Mock the icon components
jest.mock('@remixicon/react', () => ({
  RiFileTextLine: () => <div data-testid="file-line-icon">File Line Icon</div>,
  RiFileTextFill: () => <div data-testid="file-fill-icon">File Fill Icon</div>,
}));

// Mock the utility function
jest.mock('@/lib/utils/twmerge', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const mockInputBlocks: InputBlock[] = [
  {
    gid: 'test-plugin',
    cid: 'test-block-1',
    name: 'Test Input Block 1',
    description: 'This is a test input block for user data collection',
    group: 'Test Group',
    width: 'md',
    version: '1.0.0',
    author: 'Test Author',
    tags: 'test, input',
    groupNumber: 1,
    fullScreen: false,
  },
  {
    gid: 'test-plugin',
    cid: 'test-block-2',
    name: 'Test Input Block 2',
    description: 'This is another test input block for data validation',
    group: 'Test Group',
    width: 'lg',
    version: '2.0.0',
    author: 'Test Author 2',
    tags: 'test, validation',
    groupNumber: 2,
    fullScreen: true,
  },
  {
    gid: 'test-plugin',
    cid: 'test-block-3',
    name: 'Individual Input Block',
    description: 'This is an individual input block without group',
    width: 'sm',
    version: '1.5.0',
    author: 'Test Author 3',
    tags: 'individual',
    fullScreen: false,
  },
];

const defaultProps = {
  inputBlocks: mockInputBlocks,
  className: 'test-class',
};

describe('ReportInputBlocksDrawer', () => {
  describe('Rendering', () => {
    it('renders the drawer trigger with correct content when input blocks exist', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const drawer = screen.getByTestId('drawer');
      expect(drawer).toBeInTheDocument();
      
      expect(screen.getByTestId('file-fill-icon')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders the drawer trigger with correct content when no input blocks exist', () => {
      render(<ReportInputBlocksDrawer inputBlocks={[]} className="test-class" />);
      
      const drawer = screen.getByTestId('drawer');
      expect(drawer).toBeInTheDocument();
      
      const lineIcons = screen.getAllByTestId('file-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
    });

    it('renders the drawer content with correct title and description', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Input Blocks');
      expect(screen.getByTestId('drawer-description')).toHaveTextContent(
        'This report contains the following input block(s)'
      );
    });

    it('applies custom className to the container', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const container = screen.getByTestId('drawer').parentElement;
      expect(container).toHaveClass('test-class');
    });
  });

  describe('Input Block Display', () => {
    it('renders all input blocks when input blocks array is not empty', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      expect(screen.getByText('Test Input Block 1')).toBeInTheDocument();
      expect(screen.getByText('This is a test input block for user data collection')).toBeInTheDocument();
      
      expect(screen.getByText('Test Input Block 2')).toBeInTheDocument();
      expect(screen.getByText('This is another test input block for data validation')).toBeInTheDocument();
      
      expect(screen.getByText('Individual Input Block')).toBeInTheDocument();
      expect(screen.getByText('This is an individual input block without group')).toBeInTheDocument();
    });

    it('renders no input blocks when input blocks array is empty', () => {
      render(<ReportInputBlocksDrawer inputBlocks={[]} className="test-class" />);
      
      expect(screen.queryByText('Test Input Block 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Input Block 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Individual Input Block')).not.toBeInTheDocument();
    });
  });

  describe('Icon Display Logic', () => {
    it('shows filled file icon when input blocks exist', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      // Use getAllByTestId since there might be multiple elements
      const fillIcons = screen.getAllByTestId('file-fill-icon');
      expect(fillIcons.length).toBeGreaterThan(0);
      // Use getAllByTestId since there might be multiple elements
      const lineIcons = screen.getAllByTestId('file-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
    });

    it('shows line file icon when no input blocks exist', () => {
      render(<ReportInputBlocksDrawer inputBlocks={[]} className="test-class" />);
      
      // Use getAllByTestId since there might be multiple elements
      const lineIcons = screen.getAllByTestId('file-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
      // Use queryByTestId since there should be no fill icons
      expect(screen.queryByTestId('file-fill-icon')).not.toBeInTheDocument();
    });

    it('shows badge with input block count when input blocks exist', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
      // Check that the badge has the correct styling
      expect(badge).toHaveClass('absolute', '-right-2', '-top-2', 'flex', 'h-4', 'w-4', 'items-center', 'justify-center', 'rounded-full', 'bg-blue-500', 'text-[0.7rem]', 'text-white');
    });

    it('does not show badge when no input blocks exist', () => {
      render(<ReportInputBlocksDrawer inputBlocks={[]} className="test-class" />);
      
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Trigger Button', () => {
    it('renders trigger button with correct title attribute', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      // Use getAllByRole since there are multiple buttons
      const buttons = screen.getAllByRole('button');
      const triggerButton = buttons.find(button => button.getAttribute('title') === 'View input block(s) for this report');
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('title', 'View input block(s) for this report');
    });

    it('has correct styling classes', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const drawer = screen.getByTestId('drawer');
      const buttonContainer = drawer.querySelector('div');
      expect(buttonContainer).toHaveClass('flex', 'w-full', 'flex-col', 'items-start', 'gap-2');
    });
  });

  describe('Input Block List Structure', () => {
    it('renders input blocks in a proper list structure', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const inputBlockItems = screen.getAllByRole('listitem');
      expect(inputBlockItems).toHaveLength(3);
      
      inputBlockItems.forEach((item) => {
        expect(item).toHaveClass('ml-2', 'mt-1', 'flex', 'flex-col', 'items-start', 'gap-1', 'p-0', 'text-gray-400');
      });
    });

    it('renders input block names as headings', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(3);
      expect(headings[0]).toHaveTextContent('Test Input Block 1');
      expect(headings[1]).toHaveTextContent('Test Input Block 2');
      expect(headings[2]).toHaveTextContent('Individual Input Block');
    });

    it('renders input block descriptions as paragraphs', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const descriptions = screen.getAllByText(/This is a test input block/);
      expect(descriptions).toHaveLength(1);
      
      const individualDescription = screen.getByText('This is an individual input block without group');
      expect(individualDescription).toBeInTheDocument();
      
      const validationDescription = screen.getByText('This is another test input block for data validation');
      expect(validationDescription).toBeInTheDocument();
    });
  });

  describe('Footer Actions', () => {
    it('renders Go back button in footer', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const footer = screen.getByTestId('drawer-footer');
      expect(footer).toBeInTheDocument();
      
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toBeInTheDocument();
      expect(goBackButton).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('Edge Cases', () => {
    it('handles single input block correctly', () => {
      const singleInputBlock = [mockInputBlocks[0]];
      render(<ReportInputBlocksDrawer inputBlocks={singleInputBlock} className="test-class" />);
      
      expect(screen.getByText('Test Input Block 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Input Block 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Individual Input Block')).not.toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles input block with empty description', () => {
      const inputBlockWithEmptyDescription = {
        ...mockInputBlocks[0],
        description: '',
      };
      
      render(
        <ReportInputBlocksDrawer 
          {...defaultProps}
          inputBlocks={[inputBlockWithEmptyDescription]}
        />
      );
      
      expect(screen.getByText('Test Input Block 1')).toBeInTheDocument();
      // Use getAllByText since there might be multiple empty elements
      const emptyElements = screen.getAllByText('');
      expect(emptyElements.length).toBeGreaterThan(0);
    });

    it('handles input block with very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const inputBlockWithLongDescription: InputBlock = {
        ...mockInputBlocks[0],
        description: longDescription,
      };
      
      render(<ReportInputBlocksDrawer inputBlocks={[inputBlockWithLongDescription]} className="test-class" />);
      
      expect(screen.getByText('Test Input Block 1')).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles input block with missing optional properties', () => {
      const minimalInputBlock: InputBlock = {
        gid: 'test-plugin',
        cid: 'minimal-block',
        name: 'Minimal Input Block',
        description: 'A minimal input block',
      };
      
      render(<ReportInputBlocksDrawer inputBlocks={[minimalInputBlock]} className="test-class" />);
      
      expect(screen.getByText('Minimal Input Block')).toBeInTheDocument();
      expect(screen.getByText('A minimal input block')).toBeInTheDocument();
    });

    it('handles input block with all optional properties', () => {
      const fullInputBlock: InputBlock = {
        gid: 'test-plugin',
        cid: 'full-block',
        name: 'Full Input Block',
        description: 'A full input block with all properties',
        group: 'Full Group',
        width: 'xl',
        mdxContent: 'test mdx content',
        version: '3.0.0',
        author: 'Full Author',
        tags: 'full, complete',
        groupNumber: 5,
        fullScreen: true,
      };
      
      render(<ReportInputBlocksDrawer inputBlocks={[fullInputBlock]} className="test-class" />);
      
      expect(screen.getByText('Full Input Block')).toBeInTheDocument();
      expect(screen.getByText('A full input block with all properties')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button accessibility attributes', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      // Use getAllByRole since there are multiple buttons
      const buttons = screen.getAllByRole('button');
      const triggerButton = buttons.find(button => button.getAttribute('title') === 'View input block(s) for this report');
      expect(triggerButton).toHaveAttribute('title', 'View input block(s) for this report');
    });

    it('has proper list structure for input blocks', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('has proper heading structure', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(3); // 1 title + 2 input block names (the third one is individual)
    });
  });

  describe('Unique Key Generation', () => {
    it('renders all input blocks correctly', () => {
      render(<ReportInputBlocksDrawer {...defaultProps} />);
      
      expect(screen.getByText('Test Input Block 1')).toBeInTheDocument();
      expect(screen.getByText('Test Input Block 2')).toBeInTheDocument();
      expect(screen.getByText('Individual Input Block')).toBeInTheDocument();
      
      expect(screen.getByText('This is a test input block for user data collection')).toBeInTheDocument();
      expect(screen.getByText('This is another test input block for data validation')).toBeInTheDocument();
      expect(screen.getByText('This is an individual input block without group')).toBeInTheDocument();
    });
  });
}); 