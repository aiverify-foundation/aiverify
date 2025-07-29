import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Algorithm } from '@/app/plugins/utils/types';
import AlgorithmCard from '../DisplayAlgorithm';

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, 'aria-label': ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={`button-${text.toLowerCase().replace(/\s+/g, '-')}`}
      {...props}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    OUTLINE: 'outline',
  },
}));

// Mock Modal component
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ heading, children, onCloseIconClick, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid="modal"
      aria-label={ariaLabel}
      aria-modal="true"
    >
      <div data-testid="modal-header">
        <h2>{heading}</h2>
        <button onClick={onCloseIconClick} data-testid="close-modal">
          ×
        </button>
      </div>
      <div data-testid="modal-content">{children}</div>
    </div>
  ),
}));

describe('AlgorithmCard Component', () => {
  const mockAlgorithm: Algorithm = {
    gid: 'algorithm-gid-123',
    cid: 'algorithm-cid-456',
    name: 'Test Algorithm',
    modelType: ['classification', 'regression'],
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test algorithm description',
    tags: ['machine-learning', 'ai'],
    requireGroundTruth: true,
    language: 'python',
    script: 'test_algorithm.py',
    module_name: 'test_module',
    inputSchema: {
      title: 'Test Input Schema',
      description: 'Schema for test algorithm input',
      type: 'object',
      properties: {
        data: { 
          description: 'Input data array',
          type: 'array' 
        },
        parameters: { 
          description: 'Algorithm parameters',
          type: 'object' 
        }
      },
      required: ['data']
    } as any,
    outputSchema: {
      title: 'Test Output Schema', 
      description: 'Schema for test algorithm output',
      type: 'object',
      minProperties: 1,
      properties: {
        predictions: { 
          description: 'Algorithm predictions',
          type: 'array' 
        },
        confidence: { 
          description: 'Prediction confidence score',
          type: 'number' 
        }
      },
      required: ['predictions']
    } as any,
    zip_hash: 'test-hash',
  };

  const mockAlgorithmMinimal: any = {
    gid: 'minimal-gid',
    cid: 'minimal-cid',
    name: 'Minimal Algorithm',
    modelType: [],
    version: '1.0.0',
    author: 'Test Author',
    description: '',
    tags: [],
    requireGroundTruth: false,
    language: 'python',
    script: 'minimal.py',
    module_name: 'minimal_module',
    inputSchema: undefined,
    outputSchema: undefined,
    zip_hash: 'minimal-hash',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays algorithm name as heading', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Algorithm' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('displays algorithm description', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      expect(screen.getByText('Test algorithm description')).toBeInTheDocument();
    });

    it('displays default description when none provided', () => {
      const algorithmWithoutDescription = { ...mockAlgorithm, description: '' };
      render(<AlgorithmCard algorithm={algorithmWithoutDescription} />);
      expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('displays all metadata when available', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      expect(screen.getByText('algorithm-gid-123:algorithm-cid-456')).toBeInTheDocument();
      expect(screen.getByText('algorithm-cid-456')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('classification, regression')).toBeInTheDocument();
      // requireGroundTruth is only rendered if it's truthy, and it displays the boolean value
      expect(screen.queryByText('Require Ground Truth:')).toBeInTheDocument();
      expect(screen.getByText('python')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('machine-learning, ai')).toBeInTheDocument();
    });

    it('handles missing optional metadata gracefully', () => {
      render(<AlgorithmCard algorithm={mockAlgorithmMinimal} />);
      
      expect(screen.getByText('minimal-gid:minimal-cid')).toBeInTheDocument();
      expect(screen.queryByText('Modal Type:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    });

    it('displays version with fallback to N/A', () => {
      const algorithmWithoutVersion = { ...mockAlgorithm, version: '' };
      render(<AlgorithmCard algorithm={algorithmWithoutVersion} />);
      // Version is only rendered if it's truthy, so it won't show up when empty
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
    });
  });

  describe('Schema Buttons', () => {
    it('renders input schema button when inputSchema exists', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const inputButton = screen.getByTestId('button-input-schema');
      expect(inputButton).toBeInTheDocument();
      expect(inputButton).toHaveAttribute('aria-label', 'View input schema');
    });

    it('renders output schema button when outputSchema exists', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const outputButton = screen.getByTestId('button-output-schema');
      expect(outputButton).toBeInTheDocument();
      expect(outputButton).toHaveAttribute('aria-label', 'View output schema');
    });

    it('does not render schema buttons when schemas are null', () => {
      render(<AlgorithmCard algorithm={mockAlgorithmMinimal} />);
      
      expect(screen.queryByTestId('button-input-schema')).not.toBeInTheDocument();
      expect(screen.queryByTestId('button-output-schema')).not.toBeInTheDocument();
    });

    it('renders schema buttons group with correct accessibility', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const buttonGroup = screen.getByRole('group', { name: 'Schema buttons' });
      expect(buttonGroup).toBeInTheDocument();
      expect(buttonGroup).toHaveClass('mt-8', 'flex', 'space-x-4');
    });
  });

  describe('Modal Functionality', () => {
    it('opens input schema modal when input button is clicked', async () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const inputButton = screen.getByTestId('button-input-schema');
      fireEvent.click(inputButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveTextContent('Test Input Schema');
      expect(modalContent).toHaveTextContent('data');
      expect(modalContent).toHaveTextContent('parameters');
    });

    it('opens output schema modal when output button is clicked', async () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const outputButton = screen.getByTestId('button-output-schema');
      fireEvent.click(outputButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveTextContent('Test Output Schema');
      expect(modalContent).toHaveTextContent('predictions');
      expect(modalContent).toHaveTextContent('confidence');
    });

    it('closes modal when close button is clicked', async () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      // Open modal
      const inputButton = screen.getByTestId('button-input-schema');
      fireEvent.click(inputButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('modal has correct accessibility attributes', async () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const inputButton = screen.getByTestId('button-input-schema');
      fireEvent.click(inputButton);

      await waitFor(() => {
        const modal = screen.getByTestId('modal');
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-label', 'Schema details modal');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and regions', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'algorithm-algorithm-gid-123');
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'algorithm-algorithm-gid-123');
      
      const metadataList = screen.getByRole('list');
      expect(metadataList).toBeInTheDocument();
    });

    it('uses correct ID when gid is not available', () => {
      const algorithmWithoutGid = { ...mockAlgorithm, gid: '' };
      render(<AlgorithmCard algorithm={algorithmWithoutGid} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'algorithm-algorithm-cid-456');
    });

    it('list items have correct roles', () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty model types array', () => {
      const algorithmWithEmptyModelTypes = { ...mockAlgorithm, modelType: [] };
      render(<AlgorithmCard algorithm={algorithmWithEmptyModelTypes} />);
      
      expect(screen.queryByText('Modal Type:')).not.toBeInTheDocument();
    });

    it('handles empty tags array', () => {
      const algorithmWithEmptyTags = { ...mockAlgorithm, tags: [] };
      render(<AlgorithmCard algorithm={algorithmWithEmptyTags} />);
      
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    });

    it('handles very long algorithm names', () => {
      const algorithmWithLongName = {
        ...mockAlgorithm,
        name: 'This is a very long algorithm name that might cause layout issues if not handled properly'
      };
      
      render(<AlgorithmCard algorithm={algorithmWithLongName} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent(algorithmWithLongName.name);
    });

    it('handles complex schema objects', () => {
      const complexSchema = {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                features: { type: 'array', items: { type: 'number' } },
                metadata: { type: 'object' }
              }
            }
          }
        }
      };

      const algorithmWithComplexSchema = {
        ...mockAlgorithm,
        inputSchema: complexSchema as any
      };

      render(<AlgorithmCard algorithm={algorithmWithComplexSchema} />);
      
      const inputButton = screen.getByTestId('button-input-schema');
      fireEvent.click(inputButton);

      waitFor(() => {
        const modalContent = screen.getByTestId('modal-content');
        expect(modalContent).toHaveTextContent(JSON.stringify(complexSchema, null, 2));
      });
    });
  });

  describe('State Management', () => {
    it('maintains separate modal states for input and output schemas', async () => {
      render(<AlgorithmCard algorithm={mockAlgorithm} />);
      
      // Click input schema button
      const inputButton = screen.getByTestId('button-input-schema');
      fireEvent.click(inputButton);

      await waitFor(() => {
        const modalContent = screen.getByTestId('modal-content');
        expect(modalContent).toHaveTextContent('data');
        expect(modalContent).toHaveTextContent('parameters');
      });

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Click output schema button
      const outputButton = screen.getByTestId('button-output-schema');
      fireEvent.click(outputButton);

      await waitFor(() => {
        const modalContent = screen.getByTestId('modal-content');
        expect(modalContent).toHaveTextContent('predictions');
        expect(modalContent).toHaveTextContent('confidence');
      });
    });
  });
}); 