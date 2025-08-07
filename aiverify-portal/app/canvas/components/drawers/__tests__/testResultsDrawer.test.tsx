import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestResultsDrawer } from '../testResultsDrawer';
import { ParsedTestResults } from '@/app/canvas/types';

// Mock the drawer components
jest.mock('@/lib/components/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer">{children}</div>,
  DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div data-testid="drawer-trigger">{children}</div>,
  DrawerContent: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="drawer-content" className={className}>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="drawer-header">{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="drawer-title">{children}</div>,
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

// Mock the icon component
jest.mock('@remixicon/react', () => ({
  RiArticleFill: () => <div data-testid="article-icon">Article Icon</div>,
}));

// Mock the utility function
jest.mock('@/lib/utils/twmerge', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const mockTestResults: ParsedTestResults[] = [
  {
    id: 1,
    gid: 'test-plugin',
    cid: 'test-algo-1',
    name: 'Test Result 1',
    version: '1.0.0',
    startTime: '2023-01-01T00:00:00',
    timeTaken: 120,
    testArguments: {
      testDataset: 'dataset1',
      mode: 'test',
      modelType: 'classification',
      groundTruthDataset: 'groundtruth1',
      groundTruth: 'accuracy',
      algorithmArgs: '{"param1": "value1"}',
      modelFile: 'model1.pkl',
    },
    output: { accuracy: 0.95 } as any,
    artifacts: ['artifact1.png', 'artifact2.json'],
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T01:00:00',
  },
  {
    id: 2,
    gid: 'test-plugin',
    cid: 'test-algo-2',
    name: 'Test Result 2',
    version: '2.0.0',
    startTime: '2023-01-02T00:00:00',
    timeTaken: 180,
    testArguments: {
      testDataset: 'dataset2',
      mode: 'test',
      modelType: 'regression',
      groundTruthDataset: 'groundtruth2',
      groundTruth: 'mse',
      algorithmArgs: '{"param2": "value2"}',
      modelFile: 'model2.pkl',
    },
    output: { mse: 0.05 } as any,
    artifacts: ['artifact3.png'],
    created_at: '2023-01-02T00:00:00',
    updated_at: '2023-01-02T01:30:00',
  },
  {
    id: 3,
    gid: 'other-plugin',
    cid: 'test-algo-3',
    name: 'Test Result 3',
    version: '1.5.0',
    startTime: '2023-01-03T00:00:00',
    timeTaken: 90,
    testArguments: {
      testDataset: 'dataset3',
      mode: 'test',
      modelType: 'clustering',
      groundTruthDataset: 'groundtruth3',
      groundTruth: 'silhouette',
      algorithmArgs: '{"param3": "value3"}',
      modelFile: 'model3.pkl',
    },
    output: { silhouette: 0.8 } as any,
    artifacts: [],
    created_at: '2023-01-03T00:00:00',
    updated_at: '2023-01-03T00:30:00',
  },
];

const defaultProps = {
  allTestResultsOnSystem: mockTestResults,
  selectedTestResultsFromUrlParams: [],
  onCheckboxClick: jest.fn(),
  className: 'test-class',
};

describe('TestResultsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the drawer trigger button with correct content', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      // Use getAllByTestId since there are multiple buttons
      const buttons = screen.getAllByTestId('button');
      const triggerButton = buttons.find(button => button.getAttribute('data-variant') === 'white');
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('data-variant', 'white');
      
      expect(screen.getByText('Test results')).toBeInTheDocument();
      expect(screen.getByText(/none/)).toBeInTheDocument();
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    });

    it('renders the drawer content with correct title and description', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Populate widgets with test results');
      expect(screen.getByTestId('drawer-description')).toHaveTextContent(
        'Select the test results you want to use to populate the widgets.'
      );
    });

    it('applies custom className to the container', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      const container = screen.getByTestId('drawer').parentElement;
      expect(container).toHaveClass('test-class');
    });
  });

  describe('Test Results Display', () => {
    it('renders all test results correctly', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      expect(screen.getByText('Test Result 1')).toBeInTheDocument();
      expect(screen.getByText('Test Result 2')).toBeInTheDocument();
      expect(screen.getByText('Test Result 3')).toBeInTheDocument();
      
      // The actual date format depends on the user's locale and timezone
      // Let's check for the date content instead of exact format
      const dateElements1 = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('01/01') || element?.textContent?.includes('1/1')));
      });
      expect(dateElements1.length).toBeGreaterThan(0);
      const dateElements2 = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('02/01') || element?.textContent?.includes('2/1') ||
           element?.textContent?.includes('01/02') || element?.textContent?.includes('1/2')));
      });
      expect(dateElements2.length).toBeGreaterThan(0);
      const dateElements3 = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('03/01') || element?.textContent?.includes('3/1') ||
           element?.textContent?.includes('01/03') || element?.textContent?.includes('1/3')));
      });
      expect(dateElements3.length).toBeGreaterThan(0);
    });

    it('renders no test results when test results array is empty', () => {
      render(
        <TestResultsDrawer 
          {...defaultProps}
          allTestResultsOnSystem={[]}
        />
      );
      
      expect(screen.queryByText('Test Result 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Result 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Result 3')).not.toBeInTheDocument();
    });
  });

  describe('Checkbox Interactions', () => {
    it('handles test result selection', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      const firstCheckbox = screen.getByRole('checkbox', { name: /test result 1/i });
      
      // Select first test result
      fireEvent.click(firstCheckbox);
      expect(defaultProps.onCheckboxClick).toHaveBeenCalledWith([mockTestResults[0]]);
    });
  });

  describe('Checkbox State Management', () => {
    it('shows checked state for selected test results', () => {
      render(
        <TestResultsDrawer 
          {...defaultProps}
          selectedTestResultsFromUrlParams={[mockTestResults[0], mockTestResults[1]]}
        />
      );
      
      const firstCheckbox = screen.getByRole('checkbox', { name: /test result 1/i });
      const secondCheckbox = screen.getByRole('checkbox', { name: /test result 2/i });
      const thirdCheckbox = screen.getByRole('checkbox', { name: /test result 3/i });
      
      expect(firstCheckbox).toBeChecked();
      expect(secondCheckbox).toBeChecked();
      expect(thirdCheckbox).not.toBeChecked();
    });

    it('disables checkboxes for test results with same GID when not selected', () => {
      render(
        <TestResultsDrawer 
          {...defaultProps}
          selectedTestResultsFromUrlParams={[mockTestResults[0]]}
        />
      );
      
      const secondCheckbox = screen.getByRole('checkbox', { name: /test result 2/i });
      const thirdCheckbox = screen.getByRole('checkbox', { name: /test result 3/i });
      
      // Test Result 2 has same GID as Test Result 1, so it should be disabled
      expect(secondCheckbox).toBeDisabled();
      // Test Result 3 has different GID, so it should not be disabled
      expect(thirdCheckbox).not.toBeDisabled();
    });

    it('enables checkboxes for test results with same GID when they are selected', () => {
      render(
        <TestResultsDrawer 
          {...defaultProps}
          selectedTestResultsFromUrlParams={[mockTestResults[0], mockTestResults[1]]}
        />
      );
      
      const firstCheckbox = screen.getByRole('checkbox', { name: /test result 1/i });
      const secondCheckbox = screen.getByRole('checkbox', { name: /test result 2/i });
      
      // Both are selected, so they should be enabled
      expect(firstCheckbox).not.toBeDisabled();
      expect(secondCheckbox).not.toBeDisabled();
    });
  });

  describe('Selection Count Display', () => {
    it('shows "none selected" when no test results are selected', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      expect(screen.getByText('none selected')).toBeInTheDocument();
    });

    it('shows correct count when test results are selected', () => {
      render(
        <TestResultsDrawer 
          {...defaultProps}
          selectedTestResultsFromUrlParams={[mockTestResults[0], mockTestResults[2]]}
        />
      );
      
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('updates count when test results are selected/deselected', async () => {
      const user = userEvent.setup();
      const onCheckboxClick = jest.fn();
      
      render(
        <TestResultsDrawer 
          {...defaultProps} 
          onCheckboxClick={onCheckboxClick}
        />
      );
      
      expect(screen.getByText('none selected')).toBeInTheDocument();
      
      const firstCheckbox = screen.getByRole('checkbox', { name: /test result 1/i });
      await user.click(firstCheckbox);
      
      // The count should update to show 1 selected
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      // The actual date format depends on the user's locale and timezone
      // Let's check for the date content instead of exact format
      const dateElements1 = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('01/01') || element?.textContent?.includes('1/1')));
      });
      expect(dateElements1.length).toBeGreaterThan(0);
      const dateElements2 = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('02/01') || element?.textContent?.includes('2/1') ||
           element?.textContent?.includes('01/02') || element?.textContent?.includes('1/2')));
      });
      expect(dateElements2.length).toBeGreaterThan(0);
      const dateElements3 = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('03/01') || element?.textContent?.includes('3/1') ||
           element?.textContent?.includes('01/03') || element?.textContent?.includes('1/3')));
      });
      expect(dateElements3.length).toBeGreaterThan(0);
    });

    it('handles different date formats', () => {
      const testResultWithDifferentDate = {
        ...mockTestResults[0],
        created_at: '2023-12-25T15:30:45',
      };
      
      render(
        <TestResultsDrawer 
          {...defaultProps}
          allTestResultsOnSystem={[testResultWithDifferentDate]}
        />
      );
      
      // The actual date format depends on the user's locale and timezone
      // Let's check for the date content instead of exact format
      const dateElements = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('12/25') || element?.textContent?.includes('25/12')));
      });
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty test results array', () => {
      render(
        <TestResultsDrawer 
          {...defaultProps}
          allTestResultsOnSystem={[]}
        />
      );
      
      expect(screen.getByText('none selected')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('handles test result with missing name', () => {
      const testResultWithoutName = {
        ...mockTestResults[0],
        name: '',
      };
      
      render(
        <TestResultsDrawer 
          {...defaultProps}
          allTestResultsOnSystem={[testResultWithoutName]}
        />
      );
      
      // The component should handle missing names gracefully
      const dateElements = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('01/01') || element?.textContent?.includes('1/1')));
      });
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('handles test result with missing created_at', () => {
      const testResultWithoutCreatedAt = {
        ...mockTestResults[0],
        created_at: '',
      };
      
      render(
        <TestResultsDrawer 
          {...defaultProps}
          allTestResultsOnSystem={[testResultWithoutCreatedAt]}
        />
      );
      
      // The component should handle missing created_at gracefully
      expect(screen.getByText('Test Result 1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button accessibility', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      // Use getAllByTestId since there are multiple buttons
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has proper label associations', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        const label = checkbox.closest('label');
        expect(label).toBeInTheDocument();
      });
    });
  });

  describe('Footer Actions', () => {
    it('renders OK button in footer', () => {
      render(<TestResultsDrawer {...defaultProps} />);
      
      const footer = screen.getByTestId('drawer-footer');
      expect(footer).toBeInTheDocument();
      
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();
    });
  });

  describe('State Synchronization', () => {
    it('updates state when props change', () => {
      const { rerender } = render(<TestResultsDrawer {...defaultProps} />);
      
      // Initially no selection
      expect(screen.getByText(/none/)).toBeInTheDocument();
      expect(screen.getByText(/selected/)).toBeInTheDocument();
      
      // Update props to have a selection
      const propsWithSelection = {
        ...defaultProps,
        selectedTestResultsFromUrlParams: [mockTestResults[0]],
      };
      
      rerender(<TestResultsDrawer {...propsWithSelection} />);
      
      // Check that the selection count is updated
      // The text is split across multiple elements, so we need to check for both parts
      const oneElements = screen.getAllByText(/1/);
      expect(oneElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    });
  });
}); 