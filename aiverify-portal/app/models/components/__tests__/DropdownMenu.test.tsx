import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dropdown from '../DropdownMenu';

describe('DropdownMenu', () => {
  const mockData = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' },
  ];

  it('renders with default title', () => {
    render(<Dropdown id="dropdown" data={mockData} />);
    expect(screen.getByRole('button')).toHaveTextContent('Select');
  });

  it('renders with custom title', () => {
    render(<Dropdown id="dropdown" data={mockData} title="Choose" />);
    expect(screen.getByRole('button')).toHaveTextContent('Choose');
  });

  it('opens and closes dropdown on button click', () => {
    render(<Dropdown id="dropdown" data={mockData} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows all options when open', () => {
    render(<Dropdown id="dropdown" data={mockData} />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    mockData.forEach((item) => {
      expect(within(menu).getByText(item.name)).toBeInTheDocument();
    });
  });

  it('calls onSelect when an option is clicked', () => {
    const onSelect = jest.fn();
    render(<Dropdown id="dropdown" data={mockData} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Option 2'));
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('shows selected item as button text', () => {
    render(<Dropdown id="dropdown" data={mockData} selectedId="3" />);
    expect(screen.getByRole('button')).toHaveTextContent('Option 3');
  });

  it('closes dropdown when clicking outside', () => {
    render(<Dropdown id="dropdown" data={mockData} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
}); 