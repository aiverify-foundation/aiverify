import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportAlgorithmsDrawer } from '../reportAlgorithms';
import { Algorithm } from '@/app/types';

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
  RiFlaskLine: () => <div data-testid="flask-line-icon">Flask Line Icon</div>,
  RiFlaskFill: () => <div data-testid="flask-fill-icon">Flask Fill Icon</div>,
}));

// Mock the utility function
jest.mock('@/lib/utils/twmerge', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const mockAlgorithms: Algorithm[] = [
  {
    gid: 'test-plugin',
    cid: 'test-algo-1',
    name: 'Test Algorithm 1',
    modelType: ['classification'],
    version: '1.0.0',
    author: 'Test Author',
    description: 'This is a test algorithm for classification',
    tags: ['test', 'classification'],
    requireGroundTruth: true,
    language: 'python',
    script: 'test_script.py',
    module_name: 'test_module',
    inputSchema: {
      title: 'Test Input Schema',
      description: 'Test input schema description',
      type: 'object',
      required: ['input'],
      properties: {},
    },
    outputSchema: {
      title: 'Test Output Schema',
      description: 'Test output schema description',
      type: 'object',
      required: ['output'],
      minProperties: 1,
      properties: {
        feature_names: {
          type: 'array',
          description: 'Feature names',
          minItems: 1,
          items: { type: 'string' },
        },
        results: {
          title: 'Results',
          description: 'Algorithm results',
          type: 'array',
          minItems: 1,
          items: {
            description: 'Result item',
            type: 'object',
            required: ['indices'],
            minProperties: 1,
            properties: {
              indices: {
                title: 'Indices',
                type: 'array',
                minItems: 1,
                items: { type: 'number' },
              },
              ale: {
                title: 'ALE',
                type: 'array',
                minItems: 1,
                items: { type: 'number' },
              },
              size: {
                title: 'Size',
                type: 'array',
                minItems: 1,
                items: { type: 'number' },
              },
            },
          },
        },
      },
    },
    zip_hash: 'test-hash-1',
  },
  {
    gid: 'test-plugin',
    cid: 'test-algo-2',
    name: 'Test Algorithm 2',
    modelType: ['regression'],
    version: '2.0.0',
    author: 'Test Author 2',
    description: 'This is another test algorithm for regression',
    tags: ['test', 'regression'],
    requireGroundTruth: false,
    language: 'python',
    script: 'test_script_2.py',
    module_name: 'test_module_2',
    inputSchema: {
      title: 'Test Input Schema 2',
      description: 'Test input schema description 2',
      type: 'object',
      required: ['input2'],
      properties: {},
    },
    outputSchema: {
      title: 'Test Output Schema 2',
      description: 'Test output schema description 2',
      type: 'object',
      required: ['output2'],
      minProperties: 1,
      properties: {
        feature_names: {
          type: 'array',
          description: 'Feature names',
          minItems: 1,
          items: { type: 'string' },
        },
        results: {
          title: 'Results',
          description: 'Algorithm results',
          type: 'array',
          minItems: 1,
          items: {
            description: 'Result item',
            type: 'object',
            required: ['indices'],
            minProperties: 1,
            properties: {
              indices: {
                title: 'Indices',
                type: 'array',
                minItems: 1,
                items: { type: 'number' },
              },
              ale: {
                title: 'ALE',
                type: 'array',
                minItems: 1,
                items: { type: 'number' },
              },
              size: {
                title: 'Size',
                type: 'array',
                minItems: 1,
                items: { type: 'number' },
              },
            },
          },
        },
      },
    },
    zip_hash: 'test-hash-2',
  },
];

const defaultProps = {
  algorithms: mockAlgorithms,
  className: 'test-class',
};

describe('ReportAlgorithmsDrawer', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      const container = screen.getByTestId('drawer').parentElement;
      expect(container).toHaveClass('test-class');
    });

    it('renders drawer content', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    });

    it('renders drawer header', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
    });

    it('renders drawer body', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-body')).toBeInTheDocument();
    });

    it('renders drawer footer', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-footer')).toBeInTheDocument();
    });
  });

  describe('Icon Display Logic', () => {
    it('shows filled flask icon when algorithms exist', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByTestId('flask-fill-icon')).toBeInTheDocument();
    });

    it('shows line flask icon when no algorithms exist', () => {
      render(<ReportAlgorithmsDrawer algorithms={[]} className="test-class" />);
      const lineIcons = screen.getAllByTestId('flask-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
    });

    it('shows badge with algorithm count when algorithms exist', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show badge when no algorithms exist', () => {
      render(<ReportAlgorithmsDrawer algorithms={[]} className="test-class" />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Algorithm List Rendering', () => {
    it('renders all algorithms in the list', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      expect(screen.getByText('Test Algorithm 1')).toBeInTheDocument();
      expect(screen.getByText('Test Algorithm 2')).toBeInTheDocument();
      expect(screen.getByText('This is a test algorithm for classification')).toBeInTheDocument();
      expect(screen.getByText('This is another test algorithm for regression')).toBeInTheDocument();
    });

    it('renders algorithm names as headings', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Test Algorithm 1');
      expect(headings[1]).toHaveTextContent('Test Algorithm 2');
    });

    it('renders algorithm descriptions as paragraphs', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const descriptions = screen.getAllByText(/This is a test algorithm/);
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Footer Actions', () => {
    it('renders Go back button in footer', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const footer = screen.getByTestId('drawer-footer');
      expect(footer).toBeInTheDocument();
      
      const buttons = screen.getAllByTestId('button');
      const goBackButton = buttons.find(button => button.textContent?.includes('Go back'));
      expect(goBackButton).toBeInTheDocument();
      expect(goBackButton).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('Edge Cases', () => {
    it('handles single algorithm correctly', () => {
      const singleAlgorithm = [mockAlgorithms[0]];
      render(<ReportAlgorithmsDrawer algorithms={singleAlgorithm} className="test-class" />);
      
      expect(screen.getByText('Test Algorithm 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Algorithm 2')).not.toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles algorithm with missing description', () => {
      const algorithmWithoutDescription: Algorithm = {
        ...mockAlgorithms[0],
        description: '',
      };
      
      render(<ReportAlgorithmsDrawer algorithms={[algorithmWithoutDescription]} className="test-class" />);
      
      expect(screen.getByText('Test Algorithm 1')).toBeInTheDocument();
      // Empty description should render as empty paragraph
      const emptyParagraphs = screen.getAllByText('');
      expect(emptyParagraphs.length).toBeGreaterThan(0);
    });

    it('handles algorithm with very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const algorithmWithLongDescription: Algorithm = {
        ...mockAlgorithms[0],
        description: longDescription,
      };
      
      render(<ReportAlgorithmsDrawer algorithms={[algorithmWithLongDescription]} className="test-class" />);
      
      expect(screen.getByText('Test Algorithm 1')).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button accessibility attributes', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const triggerButton = buttons.find(button => button.getAttribute('title') === 'View test(s)/algorithm(s) for this report');
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('title', 'View test(s)/algorithm(s) for this report');
    });

    it('has proper heading structure', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(2); // 2 algorithm names (the title is not a heading)
    });
  });

  describe('Empty State', () => {
    it('renders correctly when no algorithms are provided', () => {
      render(<ReportAlgorithmsDrawer algorithms={[]} className="test-class" />);
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      const lineIcons = screen.getAllByTestId('flask-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
      expect(screen.queryByText('Test Algorithm 1')).not.toBeInTheDocument();
    });

    it('renders correctly when algorithms is null', () => {
      render(<ReportAlgorithmsDrawer algorithms={null as any} className="test-class" />);
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      const lineIcons = screen.getAllByTestId('flask-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
    });

    it('renders correctly when algorithms is undefined', () => {
      render(<ReportAlgorithmsDrawer algorithms={undefined as any} className="test-class" />);
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      const lineIcons = screen.getAllByTestId('flask-line-icon');
      expect(lineIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Component Structure', () => {
    it('has correct drawer structure', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const drawer = screen.getByTestId('drawer');
      expect(drawer).toBeInTheDocument();
      
      const content = screen.getByTestId('drawer-content');
      expect(content).toBeInTheDocument();
      
      const header = screen.getByTestId('drawer-header');
      expect(header).toBeInTheDocument();
      
      const body = screen.getByTestId('drawer-body');
      expect(body).toBeInTheDocument();
      
      const footer = screen.getByTestId('drawer-footer');
      expect(footer).toBeInTheDocument();
    });

    it('has correct title and description', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      expect(screen.getByText('Tests / Algorithms')).toBeInTheDocument();
      expect(screen.getByText('This report runs the following test(s)')).toBeInTheDocument();
    });

    it('has correct list structure', () => {
      render(<ReportAlgorithmsDrawer {...defaultProps} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
      
      listItems.forEach((item) => {
        expect(item).toHaveClass('ml-2', 'mt-1', 'flex', 'flex-col', 'items-start', 'gap-1', 'p-0', 'text-gray-400');
      });
    });
  });
}); 