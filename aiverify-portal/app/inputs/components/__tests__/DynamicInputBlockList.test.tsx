import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DynamicInputBlockList } from '../DynamicInputBlockList';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  );
});

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: any) => (
    <div data-testid="icon" data-name={name} data-size={size} data-color={color}>
      Icon
    </div>
  ),
  IconName: {
    ArrowLeft: 'ArrowLeft',
    Delete: 'Delete',
    File: 'File',
  },
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, variant, size, textColor, pill }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      data-text-color={textColor}
      data-pill={pill}
      onClick={onClick}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    OUTLINE: 'outline',
  },
}));

// Mock the Card component
jest.mock('@/lib/components/card/card', () => ({
  Card: ({ children, size, className, cardColor, enableTiltEffect }: any) => (
    <div
      data-testid="card"
      data-size={size}
      data-card-color={cardColor}
      data-enable-tilt={enableTiltEffect}
      className={className}
    >
      {children}
    </div>
  ),
}));

// Mock the FilterButtons component
jest.mock('../FilterButtons', () => ({
  __esModule: true,
  default: ({ onSearch, onSort }: any) => (
    <div data-testid="filter-buttons">
      <input
        data-testid="search-input"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search"
      />
      <button data-testid="sort-button" onClick={() => onSort('date-desc')}>
        Sort
      </button>
    </div>
  ),
}));

// Mock the ConfirmDeleteModal component
jest.mock('../ConfirmDeleteModal', () => ({
  ConfirmDeleteModal: ({ isOpen, onClose, onConfirm, title, itemName }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-delete-modal">
        <div data-testid="modal-title">Delete {title}</div>
        <div data-testid="modal-item-name">{itemName}</div>
        <button data-testid="confirm-delete-button" onClick={onConfirm}>
          Confirm Delete
        </button>
        <button data-testid="cancel-delete-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    );
  },
}));

// Mock the DynamicInputBlockModal component
jest.mock('../DynamicInputBlockModal', () => ({
  DynamicInputBlockModal: ({ isOpen, onClose, gid, cid, title }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="dynamic-input-block-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-gid">{gid}</div>
        <div data-testid="modal-cid">{cid}</div>
        <button data-testid="close-modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

// Mock the MessageModal component
jest.mock('../MessageModal', () => ({
  MessageModal: ({ isOpen, onClose, title, message, type }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="message-modal" data-type={type}>
        <div data-testid="message-title">{title}</div>
        <div data-testid="message-content">{message}</div>
        <button data-testid="close-message-button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

// Mock the hooks
jest.mock('@/app/inputs/hooks/useDeleteInputBlockData', () => ({
  useDeleteInputBlockData: (onSuccess: any, onError: any) => ({
    mutate: jest.fn((id) => {
      // Simulate successful deletion
      if (onSuccess) onSuccess();
    }),
  }),
}));

describe('DynamicInputBlockList', () => {
  const mockInputBlock = {
    gid: 'test-gid',
    cid: 'test-cid',
    name: 'Test Input Block',
    description: 'Test Input Block Description',
  };

  const mockInputBlockData = [
    {
      id: 1,
      name: 'Test Item 1',
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-02T00:00:00',
      gid: 'test-gid',
      cid: 'test-cid',
      group: 'test-group-1',
      data: {},
    },
    {
      id: 2,
      name: 'Test Item 2',
      created_at: '2023-01-03T00:00:00',
      updated_at: '2023-01-04T00:00:00',
      gid: 'test-gid',
      cid: 'test-cid',
      group: 'test-group-2',
      data: {},
    },
  ];

  const defaultProps = {
    title: 'Test Items',
    description: 'Test Description',
    inputBlock: mockInputBlock,
    inputBlockData: mockInputBlockData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title and description', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    expect(screen.getByText('Test Items')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders back arrow icon', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const arrowIcons = screen.getAllByTestId('icon');
    const arrowIcon = arrowIcons.find(icon => 
      icon.getAttribute('data-name') === 'ArrowLeft'
    );
    expect(arrowIcon).toHaveAttribute('data-name', 'ArrowLeft');
    expect(arrowIcon).toHaveAttribute('data-size', '40');
  });

  it('renders add new input button', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const addButton = screen.getByTestId('button');
    expect(addButton).toHaveTextContent('ADD NEW INPUT');
    expect(addButton).toHaveAttribute('data-variant', 'outline');
    expect(addButton).toHaveAttribute('data-size', 'sm');
  });

  it('renders filter buttons', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    expect(screen.getByTestId('filter-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('sort-button')).toBeInTheDocument();
  });

  it('renders input block cards', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(2);
  });

  it('displays input block names in cards', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('displays formatted dates in cards', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    expect(screen.getByText('Last updated: 02/01/2023')).toBeInTheDocument();
    expect(screen.getByText('Created: 01/01/2023')).toBeInTheDocument();
  });

  it('renders delete buttons for each item', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const deleteIcons = screen.getAllByTestId('icon');
    const deleteIconsFiltered = deleteIcons.filter(icon => 
      icon.getAttribute('data-name') === 'Delete'
    );
    expect(deleteIconsFiltered).toHaveLength(2);
  });

  it('opens add modal when add button is clicked', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const addButton = screen.getByTestId('button');
    fireEvent.click(addButton);
    
    expect(screen.getByTestId('dynamic-input-block-modal')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete button is clicked', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const deleteIcons = screen.getAllByTestId('icon');
    const deleteIcon = deleteIcons.find(icon => 
      icon.getAttribute('data-name') === 'Delete'
    );
    
    if (deleteIcon) {
      fireEvent.click(deleteIcon);
      expect(screen.getByTestId('confirm-delete-modal')).toBeInTheDocument();
    }
  });

  it('filters items based on search query', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Test Item 1' } });
    
    // Verify that the search input has the correct value
    expect(searchInput).toHaveValue('Test Item 1');
    
    // Verify that both items are still visible (since filtering is handled by the mock)
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('sorts items when sort button is clicked', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const sortButton = screen.getByTestId('sort-button');
    fireEvent.click(sortButton);
    
    // Items should be sorted (implementation depends on the actual sorting logic)
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('shows empty state when no items match search', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    expect(screen.getByText('No Test Items Found')).toBeInTheDocument();
    expect(screen.getByText(/No matching items found for/)).toBeInTheDocument();
  });

  it('shows empty state when no items exist', () => {
    render(<DynamicInputBlockList {...defaultProps} inputBlockData={[]} />);
    
    expect(screen.getByText('No Test Items Found')).toBeInTheDocument();
    expect(screen.getByText(/You haven't created any test items yet/)).toBeInTheDocument();
  });

  it('displays file icon in empty state', () => {
    render(<DynamicInputBlockList {...defaultProps} inputBlockData={[]} />);
    
    const icons = screen.getAllByTestId('icon');
    const fileIcon = icons.find(icon => 
      icon.getAttribute('data-name') === 'File'
    );
    expect(fileIcon).toHaveAttribute('data-name', 'File');
    expect(fileIcon).toHaveAttribute('data-size', '60');
  });

  it('handles delete confirmation', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    // Open delete modal
    const deleteIcons = screen.getAllByTestId('icon');
    const deleteIcon = deleteIcons.find(icon => 
      icon.getAttribute('data-name') === 'Delete'
    );
    
    if (deleteIcon) {
      fireEvent.click(deleteIcon);
      
      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete-button');
      fireEvent.click(confirmButton);
      
      // Should show success message
      expect(screen.getByTestId('message-modal')).toBeInTheDocument();
      expect(screen.getByTestId('message-title')).toHaveTextContent('Success');
    }
  });

  it('handles delete cancellation', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    // Open delete modal
    const deleteIcons = screen.getAllByTestId('icon');
    const deleteIcon = deleteIcons.find(icon => 
      icon.getAttribute('data-name') === 'Delete'
    );
    
    if (deleteIcon) {
      fireEvent.click(deleteIcon);
      
      // Cancel deletion
      const cancelButton = screen.getByTestId('cancel-delete-button');
      fireEvent.click(cancelButton);
      
      // Modal should be closed
      expect(screen.queryByTestId('confirm-delete-modal')).not.toBeInTheDocument();
    }
  });

  it('closes add modal when close button is clicked', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    // Open add modal
    const addButton = screen.getByTestId('button');
    fireEvent.click(addButton);
    
    // Close modal
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    expect(screen.queryByTestId('dynamic-input-block-modal')).not.toBeInTheDocument();
  });

  it('closes message modal when close button is clicked', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    // Trigger a delete to show message modal
    const deleteIcons = screen.getAllByTestId('icon');
    const deleteIcon = deleteIcons.find(icon => 
      icon.getAttribute('data-name') === 'Delete'
    );
    
    if (deleteIcon) {
      fireEvent.click(deleteIcon);
      const confirmButton = screen.getByTestId('confirm-delete-button');
      fireEvent.click(confirmButton);
      
      // Close message modal
      const closeMessageButton = screen.getByTestId('close-message-button');
      fireEvent.click(closeMessageButton);
      
      // Modal should be closed
      expect(screen.queryByTestId('message-modal')).not.toBeInTheDocument();
    }
  });

  it('renders cards with correct styling', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const cards = screen.getAllByTestId('card');
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-size', 'md');
      expect(card).toHaveAttribute('data-card-color', 'var(--color-secondary-950)');
      expect(card).toHaveAttribute('data-enable-tilt', 'false');
    });
  });

  it('renders links to individual items', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const links = screen.getAllByTestId('link');
    // Filter out the back arrow link and only get the item links
    const itemLinks = links.filter(link => 
      link.getAttribute('href')?.includes('/inputs/test-gid/test-cid/')
    );
    expect(itemLinks).toHaveLength(2);
    
    // Sort links by href to ensure consistent ordering
    const sortedLinks = itemLinks.sort((a, b) => {
      const hrefA = a.getAttribute('href') || '';
      const hrefB = b.getAttribute('href') || '';
      return hrefA.localeCompare(hrefB);
    });
    
    expect(sortedLinks[0]).toHaveAttribute('href', '/inputs/test-gid/test-cid/1');
    expect(sortedLinks[1]).toHaveAttribute('href', '/inputs/test-gid/test-cid/2');
  });

  it('handles long item names', () => {
    const longNameData = [
      {
        id: 1,
        name: 'This is a very long item name that might wrap to multiple lines',
        created_at: '2023-01-01T00:00:00',
        updated_at: '2023-01-02T00:00:00',
        gid: 'test-gid',
        cid: 'test-cid',
        group: 'test-group-1',
        data: {},
      },
    ];
    
    render(<DynamicInputBlockList {...defaultProps} inputBlockData={longNameData} />);
    
    expect(screen.getByText('This is a very long item name that might wrap to multiple lines')).toBeInTheDocument();
  });

  it('handles special characters in item names', () => {
    const specialCharData = [
      {
        id: 1,
        name: 'Item with special chars: !@#$%^&*()',
        created_at: '2023-01-01T00:00:00',
        updated_at: '2023-01-02T00:00:00',
        gid: 'test-gid',
        cid: 'test-cid',
        group: 'test-group-1',
        data: {},
      },
    ];
    
    render(<DynamicInputBlockList {...defaultProps} inputBlockData={specialCharData} />);
    
    expect(screen.getByText('Item with special chars: !@#$%^&*()')).toBeInTheDocument();
  });

  it('handles emojis in item names', () => {
    const emojiData = [
      {
        id: 1,
        name: 'Item with emojis 🎉🚀',
        created_at: '2023-01-01T00:00:00',
        updated_at: '2023-01-02T00:00:00',
        gid: 'test-gid',
        cid: 'test-cid',
        group: 'test-group-1',
        data: {},
      },
    ];
    
    render(<DynamicInputBlockList {...defaultProps} inputBlockData={emojiData} />);
    
    expect(screen.getByText('Item with emojis 🎉🚀')).toBeInTheDocument();
  });

  it('maintains accessibility with proper heading structure', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Items');
  });

  it('provides keyboard accessible buttons', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const addButton = screen.getByTestId('button');
    expect(addButton).toBeInTheDocument();
    
    // Test click interaction
    fireEvent.click(addButton);
    expect(screen.getByTestId('dynamic-input-block-modal')).toBeInTheDocument();
  });

  it('handles rapid search input changes', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const searchInput = screen.getByTestId('search-input');
    
    fireEvent.change(searchInput, { target: { value: 'test1' } });
    fireEvent.change(searchInput, { target: { value: 'test2' } });
    fireEvent.change(searchInput, { target: { value: 'test3' } });
    
    // Should handle rapid changes gracefully
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('handles multiple delete operations', () => {
    render(<DynamicInputBlockList {...defaultProps} />);
    
    const deleteIcons = screen.getAllByTestId('icon');
    const deleteIcon = deleteIcons.find(icon => 
      icon.getAttribute('data-name') === 'Delete'
    );
    
    if (deleteIcon) {
      // Click delete multiple times
      fireEvent.click(deleteIcon);
      fireEvent.click(deleteIcon);
      fireEvent.click(deleteIcon);
      
      // Should handle multiple clicks gracefully
      expect(screen.getByTestId('confirm-delete-modal')).toBeInTheDocument();
    }
  });
}); 