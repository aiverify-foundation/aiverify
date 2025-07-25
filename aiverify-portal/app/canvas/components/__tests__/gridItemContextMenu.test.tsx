import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridItemContextMenu } from '../gridItemContextMenu';

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('GridItemContextMenu', () => {
  const mockWidget = {
    gridItemId: 'test-widget-1',
    name: 'Test Widget',
    cid: 'test-cid',
    gid: 'test-gid',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test Description',
    tags: 'test-tags',
    dependencies: [],
    dynamicHeight: false,
    mdx: {
      code: 'export default function TestWidget() { return <div>Test</div>; }',
      frontmatter: {},
    },
    properties: [
      {
        key: 'title',
        value: 'Test Title',
        default: 'Default Title',
        helper: 'Title helper text',
      },
    ],
    widgetSize: {
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 36,
    },
    mockdata: [],
  };

  const mockProps = {
    widget: mockWidget,
    menuPosition: { top: 100, left: 200 },
    hideEditIcon: false,
    disabled: false,
    onDeleteClick: jest.fn(),
    onEditClick: jest.fn(),
    onInfoClick: jest.fn(),
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the context menu with widget name', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });

  it('renders all action buttons when not disabled', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    // Check for buttons by their container
    const buttonsContainer = screen.getByText('Test Widget').nextElementSibling;
    expect(buttonsContainer).toBeInTheDocument();
    expect(buttonsContainer?.children).toHaveLength(3); // edit, delete, info buttons
  });

  it('hides edit button when hideEditIcon is true', () => {
    const propsWithoutEdit = {
      ...mockProps,
      hideEditIcon: true,
    };
    
    render(<GridItemContextMenu {...propsWithoutEdit} />);
    
    const buttonsContainer = screen.getByText('Test Widget').nextElementSibling;
    expect(buttonsContainer).toBeInTheDocument();
    expect(buttonsContainer?.children).toHaveLength(2); // delete, info buttons only
  });

  it('does not render when disabled is true', () => {
    const disabledProps = {
      ...mockProps,
      disabled: true,
    };
    
    const { container } = render(<GridItemContextMenu {...disabledProps} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('calls onEditClick when edit button is clicked', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const buttonsContainer = screen.getByText('Test Widget').nextElementSibling;
    const editButton = buttonsContainer?.children[0] as HTMLElement;
    fireEvent.click(editButton);
    
    expect(mockProps.onEditClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteClick when delete button is clicked', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const buttonsContainer = screen.getByText('Test Widget').nextElementSibling;
    const deleteButton = buttonsContainer?.children[1] as HTMLElement;
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDeleteClick).toHaveBeenCalledTimes(1);
  });

  it('calls onInfoClick when info button is clicked', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const buttonsContainer = screen.getByText('Test Widget').nextElementSibling;
    const infoButton = buttonsContainer?.children[2] as HTMLElement;
    fireEvent.click(infoButton);
    
    expect(mockProps.onInfoClick).toHaveBeenCalledTimes(1);
  });

  it('calls onMouseEnter when mouse enters the menu', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const menuContainer = screen.getByText('Test Widget').closest('div');
    fireEvent.mouseEnter(menuContainer!);
    
    expect(mockProps.onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it('calls onMouseLeave when mouse leaves the menu', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const menuContainer = screen.getByText('Test Widget').closest('div');
    fireEvent.mouseLeave(menuContainer!);
    
    expect(mockProps.onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('applies correct positioning styles', () => {
    const { container } = render(<GridItemContextMenu {...mockProps} />);
    
    const menuContainer = container.querySelector('.fixed');
    expect(menuContainer).toHaveStyle({
      top: '100px',
      left: '200px',
    });
  });

  it('renders with correct CSS classes', () => {
    const { container } = render(<GridItemContextMenu {...mockProps} />);
    
    const menuContainer = container.querySelector('.fixed');
    expect(menuContainer).toHaveClass('fixed', 'flex', 'flex-col', 'gap-1');
    
    const nameContainer = screen.getByText('Test Widget').closest('div');
    expect(nameContainer).toHaveClass('max-w-[200px]', 'break-words', 'rounded', 'bg-secondary-600', 'px-2', 'py-1', 'text-xs', 'shadow-lg');
    
    const buttonsContainer = container.querySelector('.flex.gap-1');
    expect(buttonsContainer).toBeInTheDocument();
  });

  it('handles long widget names with proper text wrapping', () => {
    const longNameWidget = {
      ...mockWidget,
      name: 'This is a very long widget name that should wrap to multiple lines when displayed in the context menu',
    };
    
    const propsWithLongName = {
      ...mockProps,
      widget: longNameWidget,
    };
    
    render(<GridItemContextMenu {...propsWithLongName} />);
    
    expect(screen.getByText(longNameWidget.name)).toBeInTheDocument();
  });

  it('handles widget names with special characters', () => {
    const specialCharWidget = {
      ...mockWidget,
      name: 'Widget with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
    };
    
    const propsWithSpecialChars = {
      ...mockProps,
      widget: specialCharWidget,
    };
    
    render(<GridItemContextMenu {...propsWithSpecialChars} />);
    
    expect(screen.getByText(specialCharWidget.name)).toBeInTheDocument();
  });

  it('handles empty widget name', () => {
    const emptyNameWidget = {
      ...mockWidget,
      name: '',
    };
    
    const propsWithEmptyName = {
      ...mockProps,
      widget: emptyNameWidget,
    };
    
    const { container } = render(<GridItemContextMenu {...propsWithEmptyName} />);
    
    const nameContainer = container.querySelector('[class*="max-w-[200px]"]');
    expect(nameContainer).toBeInTheDocument();
    expect(nameContainer?.textContent).toBe('');
  });

  it('handles different menu positions', () => {
    const differentPositionProps = {
      ...mockProps,
      menuPosition: { top: 500, left: 800 },
    };
    
    const { container } = render(<GridItemContextMenu {...differentPositionProps} />);
    
    const menuContainer = container.querySelector('.fixed');
    expect(menuContainer).toHaveStyle({
      top: '500px',
      left: '800px',
    });
  });

  it('handles negative menu positions', () => {
    const negativePositionProps = {
      ...mockProps,
      menuPosition: { top: -100, left: -200 },
    };
    
    const { container } = render(<GridItemContextMenu {...negativePositionProps} />);
    
    const menuContainer = container.querySelector('.fixed');
    expect(menuContainer).toHaveStyle({
      top: '-100px',
      left: '-200px',
    });
  });

  it('maintains proper button styling', () => {
    const { container } = render(<GridItemContextMenu {...mockProps} />);
    
    const buttons = container.querySelectorAll('.cursor-pointer.rounded.bg-secondary-400.shadow-lg');
    expect(buttons).toHaveLength(3); // edit, delete, info buttons
    
    buttons.forEach(button => {
      expect(button).toHaveClass('cursor-pointer', 'rounded', 'bg-secondary-400', 'shadow-lg');
    });
  });

  it('handles rapid button clicks', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const buttonsContainer = screen.getByText('Test Widget').nextElementSibling;
    const editButton = buttonsContainer?.children[0] as HTMLElement;
    const deleteButton = buttonsContainer?.children[1] as HTMLElement;
    const infoButton = buttonsContainer?.children[2] as HTMLElement;
    
    // Rapid clicks
    fireEvent.click(editButton);
    fireEvent.click(deleteButton);
    fireEvent.click(infoButton);
    fireEvent.click(editButton);
    
    expect(mockProps.onEditClick).toHaveBeenCalledTimes(2);
    expect(mockProps.onDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockProps.onInfoClick).toHaveBeenCalledTimes(1);
  });

  it('handles mouse events on different parts of the menu', () => {
    render(<GridItemContextMenu {...mockProps} />);
    
    const menuContainer = screen.getByText('Test Widget').closest('div');
    const buttonsContainer = menuContainer?.nextElementSibling;
    
    // Test mouse enter on name area
    fireEvent.mouseEnter(menuContainer!);
    expect(mockProps.onMouseEnter).toHaveBeenCalledTimes(1);
    
    // Test mouse enter on buttons area
    fireEvent.mouseEnter(buttonsContainer!);
    expect(mockProps.onMouseEnter).toHaveBeenCalledTimes(2);
    
    // Test mouse leave
    fireEvent.mouseLeave(menuContainer!);
    expect(mockProps.onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('handles edge case with undefined widget name', () => {
    const undefinedNameWidget = {
      ...mockWidget,
      name: undefined as any,
    };
    
    const propsWithUndefinedName = {
      ...mockProps,
      widget: undefinedNameWidget,
    };
    
    const { container } = render(<GridItemContextMenu {...propsWithUndefinedName} />);
    
    const nameContainer = container.querySelector('[class*="max-w-[200px]"]');
    expect(nameContainer).toBeInTheDocument();
    expect(nameContainer?.textContent).toBe('');
  });

  it('handles edge case with null widget name', () => {
    const nullNameWidget = {
      ...mockWidget,
      name: null as any,
    };
    
    const propsWithNullName = {
      ...mockProps,
      widget: nullNameWidget,
    };
    
    const { container } = render(<GridItemContextMenu {...propsWithNullName} />);
    
    const nameContainer = container.querySelector('[class*="max-w-[200px]"]');
    expect(nameContainer).toBeInTheDocument();
    expect(nameContainer?.textContent).toBe('');
  });
}); 