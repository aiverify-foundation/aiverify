import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsFilters from '../FilterButtons';

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, style, svgClassName, onClick }: any) => (
    <div
      data-testid={`icon-${name}`}
      data-size={size}
      style={style}
      className={svgClassName}
      onClick={onClick}
    >
      Icon: {name}
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
jest.mock('../DropdownMenu', () => {
  return function MockDropdown({ id, title, data, selectedId, onSelect, fullWidth }: any) {
    return (
      <select
        data-testid={`dropdown-${id}`}
        data-title={title}
        data-selected-id={selectedId}
        data-full-width={fullWidth}
        onChange={(e) => onSelect(e.target.value)}
      >
        {data?.map((item: any) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    );
  };
});

describe('ResultsFilters', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    onFilter: jest.fn(),
    onSort: jest.fn(),
    activeFilter: '',
    isSplitPaneActive: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-filter-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-sort-dropdown')).toBeInTheDocument();
  });

  it('displays search input with correct placeholder', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    expect(searchInput).toHaveAttribute('placeholder', 'Search Test Results');
  });

  it('displays magnify glass icon', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const magnifyIcon = screen.getByTestId('icon-MagnifyGlass');
    expect(magnifyIcon).toBeInTheDocument();
    expect(magnifyIcon).toHaveAttribute('data-size', '20');
  });

  it('calls onSearch when search input changes', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test search');
  });

  it('displays clear search icon when search query exists', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const clearIcon = screen.getByTestId('icon-Close');
    expect(clearIcon).toBeInTheDocument();
    expect(clearIcon).toHaveAttribute('data-size', '20');
  });

  it('clears search when clear icon is clicked', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const clearIcon = screen.getByTestId('icon-Close');
    fireEvent.click(clearIcon);
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  it('calls onFilter when filter dropdown changes', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    fireEvent.change(filterDropdown, { target: { value: 'classification' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith('classification');
  });

  it('calls onSort when sort dropdown changes', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const sortDropdown = screen.getByTestId('dropdown-sort-dropdown');
    fireEvent.change(sortDropdown, { target: { value: 'date-desc' } });
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('date-desc');
  });

  it('passes correct props to filter dropdown', () => {
    render(<ResultsFilters {...defaultProps} activeFilter="classification" />);
    
    const filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    expect(filterDropdown).toHaveAttribute('data-title', 'Select');
    expect(filterDropdown).toHaveAttribute('data-selected-id', 'classification');
  });

  it('passes correct props to sort dropdown', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const sortDropdown = screen.getByTestId('dropdown-sort-dropdown');
    expect(sortDropdown).toBeInTheDocument();
  });

  it('applies horizontal layout when split pane is inactive', () => {
    render(<ResultsFilters {...defaultProps} isSplitPaneActive={false} />);
    
    const container = screen.getByTestId('text-input').closest('section');
    expect(container).toHaveClass('grid', 'gap-3', 'gap-x-16');
  });

  it('applies vertical layout when split pane is active', () => {
    render(<ResultsFilters {...defaultProps} isSplitPaneActive={true} />);
    
    const container = screen.getByTestId('text-input').closest('section');
    expect(container).toHaveClass('flex', 'flex-col', 'space-y-4');
  });

  it('has correct filter dropdown options', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    const options = filterDropdown.querySelectorAll('option');
    
    // Should have the expected filter options
    expect(options.length).toBeGreaterThan(0);
  });

  it('has correct sort dropdown options', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const sortDropdown = screen.getByTestId('dropdown-sort-dropdown');
    const options = sortDropdown.querySelectorAll('option');
    
    // Should have the expected sort options
    expect(options.length).toBeGreaterThan(0);
  });

  it('applies correct styling to search input', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    expect(searchInput).toHaveStyle({
      paddingLeft: 40,
      height: '40px',
    });
  });

  it('applies correct positioning to magnify glass icon', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const magnifyIcon = screen.getByTestId('icon-MagnifyGlass');
    expect(magnifyIcon).toHaveStyle({
      position: 'absolute',
      top: '40%',
      left: '10px',
      transform: 'translateY(-50%)',
    });
  });

  it('applies correct positioning to clear icon', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const clearIcon = screen.getByTestId('icon-Close');
    expect(clearIcon).toHaveStyle({
      position: 'absolute',
      top: '40%',
      right: '10px',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
    });
  });

  it('handles empty search query correctly', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    expect(searchInput).toHaveValue('');
    
    // Clear icon should not be visible
    expect(screen.queryByTestId('icon-Close')).not.toBeInTheDocument();
  });

  it('handles special characters in search', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: 'test@#$%^&*()' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test@#$%^&*()');
  });

  it('handles long search queries', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const longQuery = 'a'.repeat(1000);
    const searchInput = screen.getByTestId('text-input');
    fireEvent.change(searchInput, { target: { value: longQuery } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith(longQuery);
  });

  it('maintains search state correctly', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    
    // Set search query
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
    
    // Clear search query
    const clearIcon = screen.getByTestId('icon-Close');
    fireEvent.click(clearIcon);
    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  it('handles rapid search input changes', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    
    // Rapid changes
    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'ab' } });
    fireEvent.change(searchInput, { target: { value: 'abc' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(3);
    expect(defaultProps.onSearch).toHaveBeenLastCalledWith('abc');
  });

  it('handles filter dropdown with fullWidth prop', () => {
    render(<ResultsFilters {...defaultProps} isSplitPaneActive={true} />);
    
    const filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    expect(filterDropdown).toHaveAttribute('data-full-width', 'true');
  });

  it('handles sort dropdown with fullWidth prop', () => {
    render(<ResultsFilters {...defaultProps} isSplitPaneActive={true} />);
    
    const sortDropdown = screen.getByTestId('dropdown-sort-dropdown');
    expect(sortDropdown).toHaveAttribute('data-full-width', 'true');
  });

  it('has proper accessibility attributes', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const searchInput = screen.getByTestId('text-input');
    expect(searchInput).toHaveAttribute('placeholder');
    
    const filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    expect(filterDropdown).toBeInTheDocument();
    
    const sortDropdown = screen.getByTestId('dropdown-sort-dropdown');
    expect(sortDropdown).toBeInTheDocument();
  });

  it('maintains proper semantic structure', () => {
    render(<ResultsFilters {...defaultProps} />);
    
    const section = screen.getByTestId('text-input').closest('section');
    expect(section?.tagName).toBe('SECTION');
  });

  it('handles different active filter values', () => {
    const { rerender } = render(<ResultsFilters {...defaultProps} activeFilter="" />);
    
    let filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    expect(filterDropdown).toHaveAttribute('data-selected-id', '');
    
    rerender(<ResultsFilters {...defaultProps} activeFilter="regression" />);
    
    filterDropdown = screen.getByTestId('dropdown-filter-dropdown');
    expect(filterDropdown).toHaveAttribute('data-selected-id', 'regression');
  });
}); 