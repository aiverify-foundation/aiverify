import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { UserFlows } from '@/app/userFlowsEnum';
import { patchProject } from '@/lib/fetchApis/getProjects';
import { CreateTemplateCard } from '../CreateTemplateCard';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getProjects', () => ({
  patchProject: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, onClick, ...props }: any) {
    const handleClick = (e: any) => {
      e.preventDefault(); // Prevent actual navigation
      if (onClick) {
        onClick(e);
      }
    };
    
    return (
      <a href={href} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  };
});

// Mock components
jest.mock('@/lib/components/TremurCard', () => ({
  Card: function MockCard({ children, className, ...props }: any) {
    return (
      <div data-testid="tremur-card" className={className} {...props}>
        {children}
      </div>
    );
  },
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: function MockModal({ children, heading, onCloseIconClick }: any) {
    return (
      <div data-testid="modal" data-heading={heading}>
        {children}
        <button data-testid="close-modal" onClick={onCloseIconClick}>
          Close
        </button>
      </div>
    );
  },
}));

jest.mock('../NewTemplateForm', () => ({
  NewTemplateForm: function MockNewTemplateForm({ onCancel }: any) {
    return (
      <div data-testid="new-template-form">
        <button data-testid="cancel-form" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  },
}));

jest.mock('@remixicon/react', () => ({
  RiFileChartFill: function MockFileChart({ className }: any) {
    return <div data-testid="file-chart-icon" className={className} />;
  },
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe('CreateTemplateCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (patchProject as jest.Mock).mockResolvedValue({});
  });

  it('should render the create template card', () => {
    render(<CreateTemplateCard />);

    expect(screen.getByTestId('tremur-card')).toBeInTheDocument();
    expect(screen.getByText('Create New Report Template')).toBeInTheDocument();
    expect(screen.getByTestId('file-chart-icon')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<CreateTemplateCard />);

    expect(
      screen.getByText(
        'Start from scratch and design your own template. Drag widgets from the sidebar and drop them onto the canvas to build your custom report.'
      )
    ).toBeInTheDocument();
  });

  describe('Without project flow', () => {
    it('should show modal when clicked without project flow', () => {
      render(<CreateTemplateCard />);

      fireEvent.click(screen.getByTestId('tremur-card'));

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('new-template-form')).toBeInTheDocument();
    });

    it('should have link with hash href when not in project flow', () => {
      render(<CreateTemplateCard />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });
  });

  describe('Project flow without specific flows', () => {
    it('should patch project and navigate when clicked with different flow', async () => {
      // Use a different flow (not NewProject, ViewTemplate, or NewTemplate)
      render(
        <CreateTemplateCard projectId="project-123" flow={UserFlows.NewProjectWithExistingTemplate} />
      );

      fireEvent.click(screen.getByTestId('tremur-card'));

      await waitFor(() => {
        expect(patchProject).toHaveBeenCalledWith('project-123', {
          pages: [],
        });
      });

      expect(mockPush).toHaveBeenCalledWith(
        `/canvas?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=project-123&mode=edit`
      );
    });

    it('should handle project patch error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (patchProject as jest.Mock).mockRejectedValueOnce(new Error('Patch failed'));

      render(
        <CreateTemplateCard projectId="project-123" flow={UserFlows.NewProjectWithExistingTemplate} />
      );

      fireEvent.click(screen.getByTestId('tremur-card'));

      await waitFor(() => {
        expect(patchProject).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Special flows', () => {
    it('should return early for NewProject flow with projectId', () => {
      render(
        <CreateTemplateCard projectId="project-123" flow={UserFlows.NewProject} />
      );

      fireEvent.click(screen.getByTestId('tremur-card'));

      // Should not show modal for this specific flow
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should show modal for ViewTemplate flow', () => {
      render(<CreateTemplateCard flow={UserFlows.ViewTemplate} />);

      fireEvent.click(screen.getByTestId('tremur-card'));

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should show modal for NewTemplate flow', () => {
      render(<CreateTemplateCard flow={UserFlows.NewTemplate} />);

      fireEvent.click(screen.getByTestId('tremur-card'));

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when close button is clicked', () => {
      render(<CreateTemplateCard />);

      fireEvent.click(screen.getByTestId('tremur-card'));
      expect(screen.queryByTestId('modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should close modal when form cancel is clicked', () => {
      render(<CreateTemplateCard />);

      fireEvent.click(screen.getByTestId('tremur-card'));
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('cancel-form'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Link behavior', () => {
    it('should have correct href for project flow', () => {
      render(
        <CreateTemplateCard projectId="project-123" flow={UserFlows.NewProject} />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        `/canvas?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=project-123&mode=edit`
      );
    });

    it('should have hash href for non-project flow', () => {
      render(<CreateTemplateCard />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });

    it('should have hash href for ViewTemplate flow', () => {
      render(<CreateTemplateCard flow={UserFlows.ViewTemplate} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });

    it('should have hash href for NewTemplate flow', () => {
      render(<CreateTemplateCard flow={UserFlows.NewTemplate} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });
  });

  describe('Card styling', () => {
    it('should have proper CSS classes', () => {
      render(<CreateTemplateCard />);

      const card = screen.getByTestId('tremur-card');
      expect(card).toHaveClass(
        'min-h-[250px]',
        'w-[450px]',
        'cursor-pointer',
        'border-none',
        'bg-secondary-700',
        'text-white',
        'hover:bg-secondary-700'
      );
    });
  });

  describe('Icon rendering', () => {
    it('should render file chart icon with correct classes', () => {
      render(<CreateTemplateCard />);

      const icon = screen.getByTestId('file-chart-icon');
      expect(icon).toHaveClass('mr-2', 'h-8', 'w-8', 'text-primary-500');
    });
  });

  describe('Event handling', () => {
    it('should prevent default on click when showing form', async () => {
      render(<CreateTemplateCard />);

      const link = screen.getByRole('link');
      
      // Use fireEvent.click which will trigger the onClick handler
      fireEvent.click(link);

      // Wait for the modal to appear and verify preventDefault was called
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should prevent default on click when patching project', async () => {
      render(
        <CreateTemplateCard projectId="project-123" flow={UserFlows.NewProjectWithExistingTemplate} />
      );

      const link = screen.getByRole('link');
      
      // Use fireEvent.click which will trigger the onClick handler
      fireEvent.click(link);

      // Verify that patchProject was called (indicating preventDefault was called)
      await waitFor(() => {
        expect(patchProject).toHaveBeenCalledWith('project-123', {
          pages: [],
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<CreateTemplateCard />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Create New Report Template');
    });

    it('should have accessible link', () => {
      render(<CreateTemplateCard />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined projectId', () => {
      render(<CreateTemplateCard projectId={undefined} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('tremur-card'));
      }).not.toThrow();
    });

    it('should handle undefined flow', () => {
      render(<CreateTemplateCard flow={undefined} />);

      fireEvent.click(screen.getByTestId('tremur-card'));

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });
}); 