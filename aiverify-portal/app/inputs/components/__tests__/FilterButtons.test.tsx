import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChecklistsFilters from '../FilterButtons';

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, onClick, style, svgClassName }: any) => (
    <div 
      data-testid="icon" 
      data-name={name} 
      data-size={size} 
      data-color={color}
      data-svg-class={svgClassName}
      onClick={onClick}
      style={style}
    >
      Icon
    </div>
  ),
  IconName: {
    MagnifyGlass: 'MagnifyGlass',
    Close: 'Close',
  },
}));

// Mock the TextInput component
jest.mock('@/lib/components/textInput', () => ({
  TextInput: ({ placeholder, inputStyles, value, onChange }: any) => (
    <input
      data-testid="text-input"
      placeholder={placeholder}
      style={inputStyles}
      value={value}
      onChange={onChange}
    />
  ),
}));

// Mock the Dropdown component
jest.mock('../DropdownMenu', () => ({
  __esModule: true,
  default: ({ id, data, onSelect }: any) => (
    <div data-testid="dropdown" data-id={id}>
      <button data-testid="dropdown-button" onClick={() => onSelect('date-desc')}>
        Sort Options
      </button>
      {data.map((item: any) => (
        <div key={item.id} data-testid={`dropdown-option-${item.id}`}>
          {item.name}
        </div>
      ))}
    </div>
  ),
}));

describe('ChecklistsFilters', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    onSort: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with search input and dropdown', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('displays search icon', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchIcon = screen.getByTestId('icon');
    expect(searchIcon).toHaveAttribute('data-name', 'MagnifyGlass');
    expect(searchIcon).toHaveAttribute('data-size', '20');
  });

  it('calls onSearch when search input changes', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test search');
  });

  it('calls onSort when dropdown option is selected', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const dropdownButton = screen.getByTestId('dropdown-button');
    fireEvent.click(dropdownButton);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('date-desc');
  });

  it('displays clear search icon when search query exists', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const icons = screen.getAllByTestId('icon');
    const closeIcon = icons.find(icon => icon.getAttribute('data-name') === 'Close');
    expect(closeIcon).toBeInTheDocument();
  });

  it('clears search when close icon is clicked', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const icons = screen.getAllByTestId('icon');
    const closeIcon = icons.find(icon => icon.getAttribute('data-name') === 'Close');
    
    if (closeIcon) {
      fireEvent.click(closeIcon);
      expect(defaultProps.onSearch).toHaveBeenCalledWith('');
    }
  });

  it('renders dropdown with correct sort options', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    expect(screen.getByTestId('dropdown-option-date-asc')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-option-date-desc')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-option-name')).toBeInTheDocument();
  });

  it('displays correct sort option names', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    expect(screen.getByText('Updated Date (oldest to newest)')).toBeInTheDocument();
    expect(screen.getByText('Updated Date (newest to oldest)')).toBeInTheDocument();
    expect(screen.getByText('Name (A-Z)')).toBeInTheDocument();
  });

  it('applies correct styles to search input', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    expect(searchInput).toHaveStyle({
      paddingLeft: '40px',
      height: '40px',
      backgroundColor: 'var(--color-transparent)',
      color: '#FFFFFF',
    });
  });

  it('positions search icon correctly', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchIcon = screen.getByTestId('icon');
    expect(searchIcon).toHaveStyle({
      position: 'absolute',
      top: '40%',
      left: '10px',
      transform: 'translateY(-50%)',
    });
  });

  it('positions close icon correctly when visible', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const icons = screen.getAllByTestId('icon');
    const closeIcon = icons.find(icon => icon.getAttribute('data-name') === 'Close');
    
    if (closeIcon) {
      expect(closeIcon).toHaveStyle({
        position: 'absolute',
        top: '40%',
        right: '10px',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
      });
    }
  });

  it('applies correct CSS class to search icon', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchIcon = screen.getByTestId('icon');
    expect(searchIcon).toHaveAttribute('data-svg-class', 'fill-white dark:fill-white');
  });

  it('handles empty search input', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.change(searchInput, { target: { value: '' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  it('handles special characters in search input', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test@#$%^&*()' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test@#$%^&*()');
  });

  it('handles emojis in search input', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test 🎉🚀' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test 🎉🚀');
  });

  it('handles long search input', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const longSearch = 'This is a very long search query that might exceed normal input lengths';
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: longSearch } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith(longSearch);
  });

  it('maintains search state when dropdown is used', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const dropdownButton = screen.getByTestId('dropdown-button');
    fireEvent.click(dropdownButton);
    
    // Search state should be maintained
    expect(searchInput).toHaveValue('test');
  });

  it('renders with correct section structure', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const section = screen.getByTestId('filter-section');
    expect(section).toHaveClass('flex', 'justify-between');
  });

  it('handles rapid search input changes', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    
    fireEvent.change(searchInput, { target: { value: 'test1' } });
    fireEvent.change(searchInput, { target: { value: 'test2' } });
    fireEvent.change(searchInput, { target: { value: 'test3' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(3);
    expect(defaultProps.onSearch).toHaveBeenLastCalledWith('test3');
  });

  it('handles multiple dropdown selections', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const dropdownButton = screen.getByTestId('dropdown-button');
    
    fireEvent.click(dropdownButton);
    fireEvent.click(dropdownButton);
    fireEvent.click(dropdownButton);
    
    expect(defaultProps.onSort).toHaveBeenCalledTimes(3);
  });

  it('renders search input with correct placeholder', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders dropdown with correct id', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveAttribute('data-id', 'sort-dropdown');
  });

  it('handles search input with whitespace', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: '  test with spaces  ' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('  test with spaces  ');
  });

  it('maintains accessibility with proper input attributes', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search');
  });

  it('handles search input with numbers', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: '12345' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('12345');
  });

  it('handles search input with mixed content', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'Test123@#$%^&*()🎉' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('Test123@#$%^&*()🎉');
  });

  it('renders with correct flex layout', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const section = screen.getByTestId('filter-section');
    expect(section).toHaveClass('flex', 'justify-between');
  });

  it('positions elements correctly in layout', () => {
    render(<ChecklistsFilters {...defaultProps} />);
    
    const searchContainer = screen.getByTestId('text-input').parentElement;
    const dropdownContainer = screen.getByTestId('dropdown').parentElement;
    
    expect(searchContainer).toBeInTheDocument();
    expect(dropdownContainer).toBeInTheDocument();
  });
}); 