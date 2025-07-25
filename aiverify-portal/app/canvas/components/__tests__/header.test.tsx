import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasHeader } from '../header';
import { ProjectOutput } from '@/app/canvas/utils/transformProjectOutputToState';
import { TemplateOutput } from '@/app/canvas/utils/transformTemplateOutputToState';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    <img src={src} alt={alt} width={width} height={height} data-testid="logo-image" />
  );
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="link">{children}</a>
  );
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, svgClassName }: { name: string; svgClassName: string }) => (
    <div data-testid={`icon-${name}`} className={svgClassName} />
  ),
  IconName: {
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

describe('CanvasHeader Component', () => {
  const mockProject: ProjectOutput = {
    id: 1,
    templateId: 'test-template',
    testModelId: 1,
    inputBlocks: [],
    testResults: [],
    projectInfo: {
      name: 'Test Project',
      description: 'Test Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T12:30:45Z',
    pages: [],
    globalVars: [],
  };

  const mockTemplate: TemplateOutput = {
    id: 1,
    fromPlugin: false,
    projectInfo: {
      name: 'Test Template',
      description: 'Test Template Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T12:30:45Z',
    pages: [],
    globalVars: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with project data', () => {
      render(<CanvasHeader project={mockProject} />);

      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.getByText('Autosaved at 1 Jan 2023, 8:30 pm')).toBeInTheDocument();
    });

    it('renders header with template data', () => {
      render(<CanvasHeader project={mockTemplate} />);

      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.getByText('Autosaved at 1 Jan 2023, 8:30 pm')).toBeInTheDocument();
    });

    it('renders header without project data', () => {
      render(<CanvasHeader />);

      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.queryByText(/Autosaved at/)).not.toBeInTheDocument();
    });

    it('renders header with project without updated_at', () => {
      const projectWithoutUpdatedAt = {
        ...mockProject,
        updated_at: '',
      };

      render(<CanvasHeader project={projectWithoutUpdatedAt} />);

      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.queryByText(/Autosaved at/)).not.toBeInTheDocument();
    });
  });

  describe('Menu Functionality', () => {
    it('toggles menu when burger icon is clicked', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      expect(burgerIcon).toBeInTheDocument();

      // Menu should not be visible initially
      expect(screen.queryByText('Home')).not.toBeInTheDocument();

      // Click burger icon to open menu
      fireEvent.click(burgerIcon!);

      // Menu should now be visible
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('Plugins')).toBeInTheDocument();
      expect(screen.getByText('Report Templates')).toBeInTheDocument();
    });

    it('closes menu when burger icon is clicked again', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;

      // Open menu
      fireEvent.click(burgerIcon!);
      expect(screen.getByText('Home')).toBeInTheDocument();

      // Close menu
      fireEvent.click(burgerIcon!);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('renders all menu items with correct links', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      const menuItems = [
        { text: 'Home', href: '/home' },
        { text: 'Model', href: '/models' },
        { text: 'Data', href: '/datasets' },
        { text: 'Results', href: '/results' },
        { text: 'Inputs', href: '/inputs' },
        { text: 'Plugins', href: '/plugins' },
        { text: 'Report Templates', href: '/templates' },
      ];

      menuItems.forEach(({ text, href }) => {
        const link = screen.getByText(text);
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', href);
      });
    });

    it('applies hover styles to menu items', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveClass('hover:text-secondary-300');
    });
  });

  describe('Logo and Navigation', () => {
    it('renders logo with correct attributes', () => {
      render(<CanvasHeader project={mockProject} />);

      const logo = screen.getByTestId('logo-image');
      expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
      expect(logo).toHaveAttribute('alt', 'AI Verify');
      expect(logo).toHaveAttribute('width', '250');
      expect(logo).toHaveAttribute('height', '40');
    });

    it('renders logo as a link to home', () => {
      render(<CanvasHeader project={mockProject} />);

      const logoLink = screen.getByTestId('logo-image').closest('a');
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('renders bell icon', () => {
      render(<CanvasHeader project={mockProject} />);

      const bellIcon = screen.getByTestId('icon-Bell');
      expect(bellIcon).toBeInTheDocument();
      expect(bellIcon).toHaveClass('fill-white', 'dark:fill-white');
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats timestamp correctly for Singapore timezone', () => {
      render(<CanvasHeader project={mockProject} />);

      expect(screen.getByText('Autosaved at 1 Jan 2023, 8:30 pm')).toBeInTheDocument();
    });

    it('handles different timestamp formats', () => {
      const projectWithDifferentTimestamp = {
        ...mockProject,
        updated_at: '2023-12-25T15:45:30Z',
      };

      render(<CanvasHeader project={projectWithDifferentTimestamp} />);

      expect(screen.getByText('Autosaved at 25 Dec 2023, 11:45 pm')).toBeInTheDocument();
    });

    it('handles midnight timestamp', () => {
      const projectWithMidnightTimestamp = {
        ...mockProject,
        updated_at: '2023-01-01T00:00:00Z',
      };

      render(<CanvasHeader project={projectWithMidnightTimestamp} />);

      expect(screen.getByText('Autosaved at 1 Jan 2023, 8:00 am')).toBeInTheDocument();
    });

    it('handles noon timestamp', () => {
      const projectWithNoonTimestamp = {
        ...mockProject,
        updated_at: '2023-01-01T12:00:00Z',
      };

      render(<CanvasHeader project={projectWithNoonTimestamp} />);

      expect(screen.getByText('Autosaved at 1 Jan 2023, 8:00 pm')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct CSS classes to header', () => {
      render(<CanvasHeader project={mockProject} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(
        'fixed',
        'left-0',
        'right-0',
        'top-0',
        'z-50',
        'flex',
        'h-16',
        'items-center',
        'border-b',
        'border-primary-700',
        'bg-primary-950',
        'px-6',
        'backdrop-blur-sm'
      );
    });

    it('applies correct CSS classes to burger icon container', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerContainer = screen.getByTestId('icon-BurgerMenu').parentElement;
      expect(burgerContainer).toHaveClass(
        'relative',
        'flex',
        'cursor-pointer',
        'items-center'
      );
    });

    it('applies correct CSS classes to autosave text', () => {
      render(<CanvasHeader project={mockProject} />);

      const autosaveText = screen.getByText(/Autosaved at/);
      expect(autosaveText).toHaveClass('text-sm', 'text-gray-400');
    });

    it('applies correct CSS classes to logo container', () => {
      render(<CanvasHeader project={mockProject} />);

      const logoContainer = screen.getByTestId('logo-image').closest('div');
      expect(logoContainer).toHaveClass(
        'flex',
        'flex-grow',
        'items-center',
        'justify-center'
      );
    });

    it('applies correct CSS classes to bell icon container', () => {
      render(<CanvasHeader project={mockProject} />);

      const bellContainer = screen.getByTestId('icon-Bell').parentElement;
      expect(bellContainer).toHaveClass('flex', 'items-center');
    });

    it('applies correct CSS classes to menu dropdown', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      const menuDropdown = screen.getByText('Home').closest('div');
      expect(menuDropdown).toHaveClass(
        'w-50',
        'absolute',
        'left-6',
        'top-20',
        'z-[100]',
        'rounded-md',
        'bg-secondary-950',
        'p-4',
        'text-white',
        'shadow-lg'
      );
    });

    it('applies correct CSS classes to menu items', () => {
      render(<CanvasHeader project={mockProject} />);

      // Open the menu first
      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      const menuItems = screen.getAllByRole('listitem');
      // All items except the last one should have border classes
      menuItems.slice(0, -1).forEach((item) => {
        expect(item).toHaveClass('border-b', 'border-secondary-300', 'py-2');
      });

      // Last item should not have border-b
      const lastItem = menuItems[menuItems.length - 1];
      expect(lastItem).toHaveClass('py-2');
      expect(lastItem).not.toHaveClass('border-b', 'border-secondary-300');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<CanvasHeader project={mockProject} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Open the menu to see the list
      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(7);
    });

    it('has proper navigation links', () => {
      render(<CanvasHeader project={mockProject} />);

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(8); // 7 menu items + 1 logo link
    });

    it('has proper alt text for logo', () => {
      render(<CanvasHeader project={mockProject} />);

      const logo = screen.getByTestId('logo-image');
      expect(logo).toHaveAttribute('alt', 'AI Verify');
    });
  });

  describe('Edge Cases', () => {
    it('handles project with null values', () => {
      const projectWithNulls = {
        ...mockProject,
        projectInfo: {
          ...mockProject.projectInfo,
          name: null as any,
          description: null as any,
        },
      };

      render(<CanvasHeader project={projectWithNulls} />);

      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    });

    it('handles project with empty strings', () => {
      const projectWithEmptyStrings = {
        ...mockProject,
        projectInfo: {
          ...mockProject.projectInfo,
          name: '',
          description: '',
        },
      };

      render(<CanvasHeader project={projectWithEmptyStrings} />);

      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    });

    it('handles invalid timestamp format gracefully', () => {
      const projectWithInvalidTimestamp = {
        ...mockProject,
        updated_at: 'invalid-timestamp',
      };

      render(<CanvasHeader project={projectWithInvalidTimestamp} />);

      // Should not crash and should not show autosave text
      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.queryByText(/Autosaved at/)).not.toBeInTheDocument();
    });

    it('handles very old timestamp', () => {
      const projectWithOldTimestamp = {
        ...mockProject,
        updated_at: '2000-01-01T00:00:00Z',
      };

      render(<CanvasHeader project={projectWithOldTimestamp} />);

      expect(screen.getByText(/Autosaved at/)).toBeInTheDocument();
    });

    it('handles future timestamp', () => {
      const projectWithFutureTimestamp = {
        ...mockProject,
        updated_at: '2030-01-01T00:00:00Z',
      };

      render(<CanvasHeader project={projectWithFutureTimestamp} />);

      expect(screen.getByText(/Autosaved at/)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains layout structure on different screen sizes', () => {
      render(<CanvasHeader project={mockProject} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('flex', 'items-center');
    });

    it('has proper z-index for overlay elements', () => {
      render(<CanvasHeader project={mockProject} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-50');

      const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
      fireEvent.click(burgerIcon!);

      const menuDropdown = screen.getByText('Home').closest('div');
      expect(menuDropdown).toHaveClass('z-[100]');
    });
  });
}); 