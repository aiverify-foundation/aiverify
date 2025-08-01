import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Template } from '@/app/plugins/utils/types';
import TemplateCard from '../DisplayTemplate';

describe('TemplateCard Component', () => {
  const mockTemplate: Template = {
    gid: 'template-gid-123',
    cid: 'template-cid-456',
    name: 'Test Template',
    description: 'Test template description',
    author: 'Test Author',
    version: '1.0.0',
    tags: 'test,template,report',
  };

  const mockTemplateMinimal: Template = {
    gid: 'minimal-gid',
    cid: 'minimal-cid',
    name: 'Minimal Template',
    description: '',
    author: 'Test Author',
    version: '1.0.0',
    tags: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<TemplateCard template={mockTemplate} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays template name as heading', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Template' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('displays template description', () => {
      render(<TemplateCard template={mockTemplate} />);
      expect(screen.getByText('Test template description')).toBeInTheDocument();
    });

    it('displays default description when none provided', () => {
      render(<TemplateCard template={mockTemplateMinimal} />);
      expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('displays all metadata when available', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      expect(screen.getByText('template-gid-123:template-cid-456')).toBeInTheDocument();
      expect(screen.getByText('template-cid-456')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('test,template,report')).toBeInTheDocument();
    });

    it('handles missing optional metadata gracefully', () => {
      const templateWithMissingData: any = {
        ...mockTemplate,
        author: undefined,
        tags: undefined,
        version: undefined,
      };

      render(<TemplateCard template={templateWithMissingData} />);
      
      expect(screen.getByText('template-gid-123:template-cid-456')).toBeInTheDocument();
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
    });

    it('displays version with fallback to N/A', () => {
      const templateWithoutVersion = { ...mockTemplate, version: null };
      render(<TemplateCard template={templateWithoutVersion} />);
      // Version is only rendered if it's truthy, so it won't show up when null
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
    });

    it('handles empty tags gracefully', () => {
      const templateWithEmptyTags = { ...mockTemplate, tags: '' };
      render(<TemplateCard template={templateWithEmptyTags} />);
      
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and regions', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'template-template-gid-123');
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'template-template-gid-123');
      
      const metadataList = screen.getByRole('list');
      expect(metadataList).toBeInTheDocument();
    });

    it('uses correct ID when gid is not available', () => {
      const templateWithoutGid: any = { ...mockTemplate, gid: null };
      render(<TemplateCard template={templateWithoutGid} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'template-template-cid-456');
    });

    it('list items have correct roles', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to container', () => {
      render(<TemplateCard template={mockTemplate} />);
      
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
      render(<TemplateCard template={mockTemplate} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('applies correct CSS classes to description', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      const description = screen.getByText('Test template description');
      expect(description).toHaveClass('mb-2', 'text-sm');
    });

    it('applies correct CSS classes to metadata list', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      const metadataList = screen.getByRole('list');
      expect(metadataList).toHaveClass('text-sm');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long template names', () => {
      const templateWithLongName = {
        ...mockTemplate,
        name: 'This is a very long template name that might cause layout issues if not handled properly'
      };
      
      render(<TemplateCard template={templateWithLongName} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent(templateWithLongName.name);
    });

    it('handles special characters in metadata', () => {
      const templateWithSpecialChars = {
        ...mockTemplate,
        tags: 'tag1,tag2,tag@#$%^&*()',
        author: 'Author with special chars @#$%',
      };
      
      render(<TemplateCard template={templateWithSpecialChars} />);
      
      expect(screen.getByText('tag1,tag2,tag@#$%^&*()')).toBeInTheDocument();
      expect(screen.getByText('Author with special chars @#$%')).toBeInTheDocument();
    });

    it('handles empty string values', () => {
      const templateWithEmptyStrings = {
        ...mockTemplate,
        author: '',
        tags: '',
      };
      
      render(<TemplateCard template={templateWithEmptyStrings} />);
      
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    });

    it('handles null values gracefully', () => {
      const templateWithNullValues: any = {
        ...mockTemplate,
        author: null,
        tags: null,
        version: null,
      };
      
      render(<TemplateCard template={templateWithNullValues} />);
      
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('maintains correct DOM hierarchy', () => {
      render(<TemplateCard template={mockTemplate} />);
      
      const container = screen.getByRole('region');
      const heading = screen.getByRole('heading');
      const description = screen.getByText('Test template description');
      const metadataList = screen.getByRole('list');
      
      expect(container).toContainElement(heading);
      expect(container).toContainElement(description);
      expect(container).toContainElement(metadataList);
    });
  });
}); 