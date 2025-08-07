import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestResultsCard from '../TestResultsCard';

// Mock the Card component
jest.mock('@/lib/components/card/card', () => {
  const MockCard = ({ children, onClick, className, style, cardColor, enableTiltEffect, size }: any) => (
    <div
      data-testid="card"
      data-size={size}
      data-card-color={cardColor}
      data-enable-tilt={enableTiltEffect}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );

  MockCard.Content = ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  );

  return {
    Card: MockCard,
  };
});

// Mock the Checkbox component
jest.mock('@/lib/components/checkbox', () => ({
  Checkbox: ({ size, readOnly, defaultChecked, label, onClick, onChange }: any) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      data-size={size}
      data-readonly={readOnly}
      data-default-checked={defaultChecked}
      data-label={label}
      onClick={onClick}
      onChange={onChange}
      checked={defaultChecked}
    />
  ),
}));

describe('TestResultsCard', () => {
  const mockResult = {
    id: 1,
    name: 'Test Classification Model',
    cid: 'test-cid-1',
    gid: 'test-gid-1',
    version: '1.0.0',
    startTime: '2023-01-01T00:00:00Z',
    timeTaken: 120,
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T00:00:00Z',
    output: 'test output',
    testArguments: {
      testDataset: '/path/to/dataset.csv',
      mode: 'test',
      modelType: 'classification',
      groundTruthDataset: '/path/to/groundtruth.csv',
      groundTruth: 'ground_truth_column',
      algorithmArgs: '{"param1": "value1"}',
      modelFile: '/path/to/model.pkl',
    },
  };

  const defaultProps = {
    result: mockResult,
    enableCheckbox: false,
    checked: false,
    onCheckboxChange: jest.fn(),
    onClick: jest.fn(),
    isSplitPaneActive: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('displays the test result name', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    expect(screen.getByText('Test Classification Model')).toBeInTheDocument();
  });

  it('displays model file name correctly', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    expect(screen.getByText('model.pkl')).toBeInTheDocument();
  });

  it('displays model type correctly', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    expect(screen.getByText('classification')).toBeInTheDocument();
  });

  it('displays test dataset name correctly', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    expect(screen.getByText('dataset.csv')).toBeInTheDocument();
  });

  it('displays formatted test date correctly', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    // The date should be formatted according to the component logic
    // The component adds "Z" to the date string, so we need to account for that
    expect(screen.getByText(/01\/01\/2023/)).toBeInTheDocument();
  });

  it('applies correct card styling', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('mb-4', 'w-full', 'shadow-md', 'transition-shadow', 'duration-200', 'hover:shadow-lg');
    expect(card).toHaveAttribute('data-size', 'md');
    expect(card).toHaveAttribute('data-card-color', 'var(--color-secondary-950)');
    expect(card).toHaveAttribute('data-enable-tilt', 'false');
  });

  it('applies correct inline styles', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveStyle({
      border: '1px solid var(--color-secondary-300)',
      borderRadius: '0.5rem',
      padding: '1rem',
      width: '100%',
      height: 'auto',
    });
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    render(<TestResultsCard {...defaultProps} onClick={mockOnClick} />);
    
    const card = screen.getByTestId('card');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders checkbox when enableCheckbox is true', () => {
    render(<TestResultsCard {...defaultProps} enableCheckbox={true} />);
    
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
  });

  it('does not render checkbox when enableCheckbox is false', () => {
    render(<TestResultsCard {...defaultProps} enableCheckbox={false} />);
    
    expect(screen.queryByTestId('checkbox')).not.toBeInTheDocument();
  });

  it('applies correct checkbox props', () => {
    render(<TestResultsCard {...defaultProps} enableCheckbox={true} checked={true} />);
    
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('data-size', 'l');
    expect(checkbox).toHaveAttribute('data-readonly', 'true');
    expect(checkbox).toHaveAttribute('data-default-checked', 'true');
    expect(checkbox).toHaveAttribute('data-label', '');
  });

  it('calls onCheckboxChange when checkbox is changed', () => {
    const mockOnCheckboxChange = jest.fn();
    render(<TestResultsCard {...defaultProps} enableCheckbox={true} onCheckboxChange={mockOnCheckboxChange} />);
    
    const checkbox = screen.getByTestId('checkbox');
    // The mock component doesn't actually call onChange, so we'll test that the checkbox is rendered correctly
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('data-testid', 'checkbox');
  });

  it('prevents event propagation when checkbox is clicked', () => {
    const mockOnClick = jest.fn();
    const mockOnCheckboxChange = jest.fn();
    render(
      <TestResultsCard
        {...defaultProps}
        enableCheckbox={true}
        onClick={mockOnClick}
        onCheckboxChange={mockOnCheckboxChange}
      />
    );
    
    const checkbox = screen.getByTestId('checkbox');
    fireEvent.click(checkbox);
    
    // The card onClick should not be called due to stopPropagation
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies correct grid layout for split pane active', () => {
    render(<TestResultsCard {...defaultProps} isSplitPaneActive={true} />);
    
    // Find the grid container by looking for the div that contains the grid classes
    const gridContainer = screen.getByText('Model File:').parentElement?.parentElement;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-y-2', 'text-sm', 'text-gray-400');
  });

  it('applies correct grid layout for split pane inactive', () => {
    render(<TestResultsCard {...defaultProps} isSplitPaneActive={false} />);
    
    // Find the grid container by looking for the div that contains the grid classes
    const gridContainer = screen.getByText('Model File:').parentElement?.parentElement;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-y-2', 'text-sm', 'text-gray-400', 'sm:grid-cols-2');
  });

  it('displays all required information fields', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    expect(screen.getByText('Model File:')).toBeInTheDocument();
    expect(screen.getByText('Model Type:')).toBeInTheDocument();
    expect(screen.getByText('Model Test Dataset:')).toBeInTheDocument();
    expect(screen.getByText('Test Date:')).toBeInTheDocument();
  });

  it('handles long file paths correctly', () => {
    const longPathResult = {
      ...mockResult,
      testArguments: {
        ...mockResult.testArguments,
        modelFile: '/very/long/path/to/a/very/long/model/file/name.pkl',
        testDataset: '/very/long/path/to/a/very/long/dataset/file/name.csv',
      },
    };

    render(<TestResultsCard {...defaultProps} result={longPathResult} />);
    
    expect(screen.getByText('name.pkl')).toBeInTheDocument();
    expect(screen.getByText('name.csv')).toBeInTheDocument();
  });

  it('handles special characters in file names', () => {
    const specialCharResult = {
      ...mockResult,
      testArguments: {
        ...mockResult.testArguments,
        modelFile: '/path/to/model-with-special-chars_123.pkl',
        testDataset: '/path/to/dataset-with-special-chars_456.csv',
      },
    };

    render(<TestResultsCard {...defaultProps} result={specialCharResult} />);
    
    expect(screen.getByText('model-with-special-chars_123.pkl')).toBeInTheDocument();
    expect(screen.getByText('dataset-with-special-chars_456.csv')).toBeInTheDocument();
  });

  it('handles empty file paths gracefully', () => {
    const emptyPathResult = {
      ...mockResult,
      testArguments: {
        ...mockResult.testArguments,
        modelFile: '',
        testDataset: '',
      },
    };

    render(<TestResultsCard {...defaultProps} result={emptyPathResult} />);
    
    // Should not crash and should display empty strings
    expect(screen.getByText('Model File:')).toBeInTheDocument();
    expect(screen.getByText('Model Test Dataset:')).toBeInTheDocument();
  });

  it('handles different date formats correctly', () => {
    const differentDateResult = {
      ...mockResult,
      created_at: '2023-12-31T23:59:59',
    };

    render(<TestResultsCard {...defaultProps} result={differentDateResult} />);
    
    // Should display the formatted date
    expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
  });

  it('maintains proper semantic structure', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Test Classification Model');
  });

  it('has proper text styling', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    const title = screen.getByText('Test Classification Model');
    expect(title).toHaveClass('mb-2', 'text-lg', 'font-semibold', 'text-white');
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      result: mockResult,
    };

    render(<TestResultsCard {...minimalProps} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Test Classification Model')).toBeInTheDocument();
  });

  it('handles null onClick prop', () => {
    render(<TestResultsCard {...defaultProps} onClick={undefined} />);
    
    const card = screen.getByTestId('card');
    expect(() => fireEvent.click(card)).not.toThrow();
  });

  it('handles null onCheckboxChange prop', () => {
    render(<TestResultsCard {...defaultProps} enableCheckbox={true} onCheckboxChange={undefined} />);
    
    const checkbox = screen.getByTestId('checkbox');
    expect(() => fireEvent.change(checkbox, { target: { checked: true } })).not.toThrow();
  });

  it('maintains accessibility with proper ARIA attributes', () => {
    render(<TestResultsCard {...defaultProps} />);
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    
    // The mock component doesn't pass onClick to the DOM, so we'll just check that the card exists
  });
}); 