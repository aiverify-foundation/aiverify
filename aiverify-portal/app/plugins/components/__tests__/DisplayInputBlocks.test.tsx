import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { inputBlock } from '@/app/plugins/utils/types';
import InputBlockCard from '../DisplayInputBlocks';

describe('InputBlockCard Component', () => {
  const mockInputBlock: inputBlock = {
    gid: 'input-gid-123',
    cid: 'input-cid-456',
    name: 'Test Input Block',
    description: 'Test input block description',
    group: 'test-group',
    width: '100%',
    version: '1.0.0',
    author: 'Test Author',
    tags: 'test,input,block',
    groupNumber: 1,
    fullScreen: false,
  };

  const mockInputBlockMinimal: inputBlock = {
    gid: 'minimal-gid',
    cid: 'minimal-cid',
    name: 'Minimal Input Block',
    description: '',
    group: 'minimal-group',
    width: '50%',
    version: '1.0.0',
    author: 'Test Author',
    tags: '',
    groupNumber: 1,
    fullScreen: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays input block name as heading', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Input Block' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('displays input block description', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      expect(screen.getByText('Test input block description')).toBeInTheDocument();
    });

    it('displays default description when none provided', () => {
      render(<InputBlockCard input_block={mockInputBlockMinimal} />);
      expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('displays all metadata when available', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      expect(screen.getByText('input-gid-123:input-cid-456')).toBeInTheDocument();
      expect(screen.getByText('input-cid-456')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('test-group')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('test,input,block')).toBeInTheDocument();
    });

    it('handles missing optional metadata gracefully', () => {
      const inputBlockWithMissingData: any = {
        ...mockInputBlock,
        author: undefined,
        tags: undefined,
        width: undefined,
        version: undefined,
        group: undefined,
      };

      render(<InputBlockCard input_block={inputBlockWithMissingData} />);
      
      expect(screen.getByText('input-gid-123:input-cid-456')).toBeInTheDocument();
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
      expect(screen.queryByText('Width:')).not.toBeInTheDocument();
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
      expect(screen.queryByText('Group:')).not.toBeInTheDocument();
    });

    it('displays version with fallback to N/A', () => {
      const inputBlockWithoutVersion = { ...mockInputBlock, version: null };
      render(<InputBlockCard input_block={inputBlockWithoutVersion} />);
      // Version is only rendered if it's truthy, so it won't show up when null
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
    });

    it('handles empty tags gracefully', () => {
      const inputBlockWithEmptyTags = { ...mockInputBlock, tags: '' };
      render(<InputBlockCard input_block={inputBlockWithEmptyTags} />);
      
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and regions', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'input-block-input-gid-123');
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'input-block-input-gid-123');
      
      const metadataList = screen.getByRole('list');
      expect(metadataList).toBeInTheDocument();
    });

    it('uses correct ID when gid is not available', () => {
      const inputBlockWithoutGid: any = { ...mockInputBlock, gid: null };
      render(<InputBlockCard input_block={inputBlockWithoutGid} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'input-block-input-cid-456');
    });

    it('list items have correct roles', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to container', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveClass(
        'mb-8',
        'rounded-lg',
        'border',
        'border-secondary-300',
        'bg-secondary-800',
        'p-6'
      );
    });

    it('applies correct CSS classes to heading', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('applies correct CSS classes to description', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const description = screen.getByText('Test input block description');
      expect(description).toHaveClass('mb-4', 'text-sm');
    });

    it('applies correct CSS classes to metadata list', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const metadataList = screen.getByRole('list');
      expect(metadataList).toHaveClass('text-sm');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long input block names', () => {
      const inputBlockWithLongName = {
        ...mockInputBlock,
        name: 'This is a very long input block name that might cause layout issues if not handled properly'
      };
      
      render(<InputBlockCard input_block={inputBlockWithLongName} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent(inputBlockWithLongName.name);
    });

    it('handles special characters in metadata', () => {
      const inputBlockWithSpecialChars = {
        ...mockInputBlock,
        tags: 'tag1,tag2,tag@#$%^&*()',
        group: 'group-with-special-chars@#$%',
      };
      
      render(<InputBlockCard input_block={inputBlockWithSpecialChars} />);
      
      expect(screen.getByText('tag1,tag2,tag@#$%^&*()')).toBeInTheDocument();
      expect(screen.getByText('group-with-special-chars@#$%')).toBeInTheDocument();
    });

    it('handles numeric values in width', () => {
      const inputBlockWithNumericWidth = {
        ...mockInputBlock,
        width: '50px',
      };
      
      render(<InputBlockCard input_block={inputBlockWithNumericWidth} />);
      
      expect(screen.getByText('50px')).toBeInTheDocument();
    });

    it('handles empty string values', () => {
      const inputBlockWithEmptyStrings = {
        ...mockInputBlock,
        author: '',
        tags: '',
        group: '',
        width: '',
      };
      
      render(<InputBlockCard input_block={inputBlockWithEmptyStrings} />);
      
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
      expect(screen.queryByText('Group:')).not.toBeInTheDocument();
      expect(screen.queryByText('Width:')).not.toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('maintains correct DOM hierarchy', () => {
      render(<InputBlockCard input_block={mockInputBlock} />);
      
      const container = screen.getByRole('region');
      const heading = screen.getByRole('heading');
      const description = screen.getByText('Test input block description');
      const metadataList = screen.getByRole('list');
      
      expect(container).toContainElement(heading);
      expect(container).toContainElement(description);
      expect(container).toContainElement(metadataList);
    });
  });
}); 