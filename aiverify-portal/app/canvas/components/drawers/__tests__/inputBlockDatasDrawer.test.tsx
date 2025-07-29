import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputBlockDatasDrawer } from '../inputBlockDatasDrawer';
import { InputBlockData } from '@/app/types';

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
  RiDatabase2Fill: () => <div data-testid="database-icon">Database Icon</div>,
}));

// Mock the utility function
jest.mock('@/lib/utils/twmerge', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const mockInputBlockData: InputBlockData[] = [
  {
    id: 1,
    gid: 'test-plugin',
    cid: 'test-block-1',
    name: 'Test Block 1',
    group: 'Test Group',
    data: { test: 'data1' },
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T00:00:00',
  },
  {
    id: 2,
    gid: 'test-plugin',
    cid: 'test-block-2',
    name: 'Test Block 2',
    group: 'Test Group',
    data: { test: 'data2' },
    created_at: '2023-01-02T00:00:00',
    updated_at: '2023-01-02T00:00:00',
  },
  {
    id: 3,
    gid: 'test-plugin',
    cid: 'test-block-3',
    name: 'Individual Block',
    group: '',
    data: { test: 'data3' },
    created_at: '2023-01-03T00:00:00',
    updated_at: '2023-01-03T00:00:00',
  },
  {
    id: 4,
    gid: 'test-plugin',
    cid: 'test-block-4',
    name: 'Individual Block',
    group: '',
    data: { test: 'data4' },
    created_at: '2023-01-04T00:00:00',
    updated_at: '2023-01-04T00:00:00',
  },
];

const defaultProps = {
  allInputBlockDatasOnSystem: mockInputBlockData,
  selectedInputBlockDatasFromUrlParams: [],
  onCheckboxClick: jest.fn(),
  className: 'test-class',
};

describe('InputBlockDatasDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the drawer trigger button with correct content', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      // Use getAllByTestId since there are multiple buttons
      const buttons = screen.getAllByTestId('button');
      const triggerButton = buttons.find(button => button.getAttribute('data-variant') === 'white');
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('data-variant', 'white');
      
      expect(screen.getByText('Input block data')).toBeInTheDocument();
      expect(screen.getByText(/none/)).toBeInTheDocument();
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    });

    it('renders the drawer content with correct title and description', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Populate widgets with input block data');
      expect(screen.getByTestId('drawer-description')).toHaveTextContent(
        'Select the input block data you want to use to populate the widgets.'
      );
    });

    it('applies custom className to the container', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      const container = screen.getByTestId('drawer').parentElement;
      expect(container).toHaveClass('test-class');
    });
  });

  describe('Grouped Input Blocks', () => {
    it('renders grouped input blocks section when grouped blocks exist', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      expect(screen.getByText('Grouped Input Blocks')).toBeInTheDocument();
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      // The text is split across multiple elements, so we need to check for parts
      const twoElements = screen.getAllByText(/2/);
      expect(twoElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/items/)).toBeInTheDocument();
      const dateElements = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('01/01') || element?.textContent?.includes('1/1')));
      });
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('handles group selection correctly', async () => {
      const user = userEvent.setup();
      const onCheckboxClick = jest.fn();
      
      render(
        <InputBlockDatasDrawer 
          {...defaultProps} 
          onCheckboxClick={onCheckboxClick}
        />
      );
      
      const groupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      await user.click(groupCheckbox);
      
      expect(onCheckboxClick).toHaveBeenCalledWith([
        mockInputBlockData[0],
        mockInputBlockData[1],
      ]);
    });

    it('handles group deselection correctly', async () => {
      const user = userEvent.setup();
      const onCheckboxClick = jest.fn();
      
      render(
        <InputBlockDatasDrawer 
          {...defaultProps} 
          selectedInputBlockDatasFromUrlParams={[mockInputBlockData[0], mockInputBlockData[1]]}
          onCheckboxClick={onCheckboxClick}
        />
      );
      
      const groupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      await user.click(groupCheckbox);
      
      expect(onCheckboxClick).toHaveBeenCalledWith([]);
    });

    it('disables group selection when other groups are selected', () => {
      const otherGroupData: InputBlockData = {
        id: 5,
        gid: 'other-plugin',
        cid: 'other-block',
        name: 'Other Block',
        group: 'Other Group',
        data: { test: 'other' },
        created_at: '2023-01-05T00:00:00',
        updated_at: '2023-01-05T00:00:00',
      };
      
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          allInputBlockDatasOnSystem={[...mockInputBlockData, otherGroupData]}
          selectedInputBlockDatasFromUrlParams={[otherGroupData]}
        />
      );
      
      const groupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      expect(groupCheckbox).toBeDisabled();
    });
  });

  describe('Individual Input Blocks', () => {
    it('renders individual input blocks section when non-grouped blocks exist', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      expect(screen.getByText('Individual Input Blocks')).toBeInTheDocument();
      expect(screen.getByText('Individual Block')).toBeInTheDocument();
      // The actual date format depends on the user's locale and timezone
      const dateElements = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes('2023') && 
          (element?.textContent?.includes('03/01') || element?.textContent?.includes('3/1') ||
           element?.textContent?.includes('01/03') || element?.textContent?.includes('1/3')));
      });
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('handles individual block selection correctly', async () => {
      const user = userEvent.setup();
      
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      const individualCheckbox = screen.getByRole('checkbox', { name: /individual block/i });
      await user.click(individualCheckbox);
      
      expect(defaultProps.onCheckboxClick).toHaveBeenCalledWith([mockInputBlockData[2]]);
    });

    it('handles individual block deselection correctly', async () => {
      const user = userEvent.setup();
      const onCheckboxClick = jest.fn();
      
      render(
        <InputBlockDatasDrawer 
          {...defaultProps} 
          selectedInputBlockDatasFromUrlParams={[mockInputBlockData[2]]}
          onCheckboxClick={onCheckboxClick}
        />
      );
      
      const individualCheckbox = screen.getByRole('checkbox', { name: /individual block/i });
      await user.click(individualCheckbox);
      
      expect(onCheckboxClick).toHaveBeenCalledWith([]);
    });
  });

  describe('Selection Count Display', () => {
    it('shows "none selected" when no items are selected', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      expect(screen.getByText('none selected')).toBeInTheDocument();
    });

    it('shows correct count when grouped items are selected', () => {
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          selectedInputBlockDatasFromUrlParams={[mockInputBlockData[0], mockInputBlockData[1]]}
        />
      );
      
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('shows correct count when individual items are selected', () => {
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          selectedInputBlockDatasFromUrlParams={[mockInputBlockData[2]]}
        />
      );
      
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('shows correct count when both grouped and individual items are selected', () => {
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          selectedInputBlockDatasFromUrlParams={[
            mockInputBlockData[0], 
            mockInputBlockData[1], 
            mockInputBlockData[2]
          ]}
        />
      );
      
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input block data array', () => {
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          allInputBlockDatasOnSystem={[]}
        />
      );
      
      expect(screen.getByText('none selected')).toBeInTheDocument();
      expect(screen.queryByText('Individual Input Blocks')).not.toBeInTheDocument();
      expect(screen.queryByText('Grouped Input Blocks')).not.toBeInTheDocument();
    });

    it('handles input block data with missing group property', () => {
      const dataWithoutGroup: InputBlockData[] = [
        {
          id: 1,
          gid: 'test-plugin',
          cid: 'test-block',
          name: 'Test Block',
          group: '',
          data: { test: 'data' },
          created_at: '2023-01-01T00:00:00',
          updated_at: '2023-01-01T00:00:00',
        },
      ];
      
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          allInputBlockDatasOnSystem={dataWithoutGroup}
        />
      );
      
      expect(screen.getByText('Individual Input Blocks')).toBeInTheDocument();
      expect(screen.queryByText('Grouped Input Blocks')).not.toBeInTheDocument();
    });

    it('handles input block data with only group property', () => {
      const dataWithOnlyGroup: InputBlockData[] = [
        {
          id: 1,
          gid: 'test-plugin',
          cid: 'test-block',
          name: 'Test Block',
          group: 'Test Group',
          data: { test: 'data' },
          created_at: '2023-01-01T00:00:00',
          updated_at: '2023-01-01T00:00:00',
        },
      ];
      
      render(
        <InputBlockDatasDrawer 
          {...defaultProps}
          allInputBlockDatasOnSystem={dataWithOnlyGroup}
        />
      );
      
      expect(screen.getByText('Grouped Input Blocks')).toBeInTheDocument();
      expect(screen.queryByText('Individual Input Blocks')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('has proper button accessibility', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      // Use getAllByTestId since there are multiple buttons
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Footer Actions', () => {
    it('renders OK button in footer', () => {
      render(<InputBlockDatasDrawer {...defaultProps} />);
      
      const footer = screen.getByTestId('drawer-footer');
      expect(footer).toBeInTheDocument();
      
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();
    });
  });
}); 