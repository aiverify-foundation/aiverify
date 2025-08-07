import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import LayoutHeader from '../LayoutHeader';
import { IconName } from '@/lib/components/IconSVG';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
    return <img src={src} alt={alt} width={width} height={height} data-testid="logo-image" />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href} data-testid="logo-link">{children}</a>;
  };
});

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, svgClassName }: { name: string; size?: number; color?: string; svgClassName?: string }) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color} data-class={svgClassName}>
      {name}
    </div>
  ),
  IconName: {
    ArrowLeft: 'ArrowLeft',
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

// Create a wrapper component for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('LayoutHeader', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the header with all main elements', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.getByTestId('logo-link')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
    });

    it('should render header with correct CSS classes', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed');
      expect(header).toHaveClass('left-0');
      expect(header).toHaveClass('right-0');
      expect(header).toHaveClass('top-0');
      expect(header).toHaveClass('z-50');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('h-16');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-primary-700');
      expect(header).toHaveClass('bg-primary-950');
      expect(header).toHaveClass('px-6');
      expect(header).toHaveClass('backdrop-blur-sm');
    });

    it('should render logo with correct attributes', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const logoImage = screen.getByTestId('logo-image');
      expect(logoImage).toHaveAttribute('src', '/aiverify-logo-white.svg');
      expect(logoImage).toHaveAttribute('alt', 'AI Verify');
      expect(logoImage).toHaveAttribute('width', '250');
      expect(logoImage).toHaveAttribute('height', '40');
    });

    it('should render logo link with correct href', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const logoLink = screen.getByTestId('logo-link');
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('should render icons with correct attributes', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerIcon = screen.getByTestId('icon-BurgerMenu');
      expect(burgerIcon).toHaveAttribute('data-class', 'fill-white dark:fill-white');
      
      const bellIcon = screen.getByTestId('icon-Bell');
      expect(bellIcon).toHaveAttribute('data-class', 'fill-white dark:fill-white');
    });
  });

  describe('Project Flow Mode', () => {
    it('should render back button when projectId is provided', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
      expect(screen.getByText('Back to Project')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-BurgerMenu')).not.toBeInTheDocument();
    });

    it('should render back button with correct styling', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const backButton = screen.getByRole('button');
      expect(backButton).toHaveClass('flex');
      expect(backButton).toHaveClass('items-center');
      expect(backButton).toHaveClass('gap-2');
      expect(backButton).toHaveClass('text-white');
      expect(backButton).toHaveClass('hover:text-primary-300');
    });

    it('should render back button text with correct styling', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const backText = screen.getByText('Back to Project');
      expect(backText).toHaveClass('text-lg');
      expect(backText).toHaveClass('font-semibold');
      expect(backText).toHaveClass('text-white');
    });

    it('should render arrow icon with correct attributes', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const arrowIcon = screen.getByTestId('icon-ArrowLeft');
      expect(arrowIcon).toHaveAttribute('data-size', '30');
      expect(arrowIcon).toHaveAttribute('data-color', 'currentColor');
    });

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const backButton = screen.getByRole('button');
      await user.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should not show menu dropdown in project flow mode', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Model')).not.toBeInTheDocument();
      expect(screen.queryByText('Data')).not.toBeInTheDocument();
    });

    it('should detect project flow when projectId is provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      expect(consoleSpy).toHaveBeenCalledWith('isProjectFlow:', true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Non-Project Flow Mode', () => {
    it('should render burger menu when no projectId is provided', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
      expect(screen.queryByText('Back to Project')).not.toBeInTheDocument();
    });

    it('should render burger menu with correct styling', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenuContainer = screen.getByTestId('icon-BurgerMenu').parentElement;
      expect(burgerMenuContainer).toHaveClass('relative');
      expect(burgerMenuContainer).toHaveClass('ml-6');
      expect(burgerMenuContainer).toHaveClass('flex');
      expect(burgerMenuContainer).toHaveClass('cursor-pointer');
      expect(burgerMenuContainer).toHaveClass('items-center');
    });

    it('should toggle menu when burger menu is clicked', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      
      // Menu should be closed initially
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      
      // Click to open menu
      await user.click(burgerMenu!);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('Plugins')).toBeInTheDocument();
      expect(screen.getByText('Report Templates')).toBeInTheDocument();
      
      // Click again to close menu
      await user.click(burgerMenu!);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should render menu dropdown with correct styling', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      await user.click(burgerMenu!);
      
      // Find the menu dropdown div by looking for the element with the specific classes
      const menuDropdown = document.querySelector('.w-50.absolute.left-6.top-20.z-\\[100\\]');
      expect(menuDropdown).toBeInTheDocument();
      expect(menuDropdown).toHaveClass('w-50');
      expect(menuDropdown).toHaveClass('absolute');
      expect(menuDropdown).toHaveClass('left-6');
      expect(menuDropdown).toHaveClass('top-20');
      expect(menuDropdown).toHaveClass('z-[100]');
      expect(menuDropdown).toHaveClass('rounded-md');
      expect(menuDropdown).toHaveClass('bg-secondary-950');
      expect(menuDropdown).toHaveClass('p-4');
      expect(menuDropdown).toHaveClass('text-white');
      expect(menuDropdown).toHaveClass('shadow-lg');
    });

    it('should render all menu items with correct styling', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      await user.click(burgerMenu!);
      
      const menuItems = screen.getAllByRole('listitem');
      expect(menuItems).toHaveLength(7);
      
      // Check that all items have correct classes
      menuItems.forEach((item, index) => {
        if (index < 6) {
          // First 6 items should have border-b
          expect(item).toHaveClass('border-b');
          expect(item).toHaveClass('border-secondary-300');
        }
        expect(item).toHaveClass('py-2');
      });
    });

    it('should render menu links with correct hrefs and styling', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      await user.click(burgerMenu!);
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(8); // 7 menu links + 1 logo link
      
      const expectedHrefs = [
        '/home',
        '/models',
        '/datasets',
        '/results',
        '/inputs',
        '/plugins',
        '/templates',
        '/home', // Logo link
      ];
      
      links.forEach((link, index) => {
        expect(link).toHaveAttribute('href', expectedHrefs[index]);
        // Note: Mock Link component doesn't preserve className, so we skip class checks
      });
    });

    it('should detect non-project flow when no projectId is provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      expect(consoleSpy).toHaveBeenCalledWith('isProjectFlow:', false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Layout Structure', () => {
    it('should have three main sections: left navigation, center logo, right bell', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const header = screen.getByRole('banner');
      const children = header.children;
      
      expect(children).toHaveLength(3);
      
      // Left navigation
      expect(children[0]).toHaveClass('flex');
      expect(children[0]).toHaveClass('items-center');
      
      // Center logo
      expect(children[1]).toHaveClass('flex');
      expect(children[1]).toHaveClass('flex-grow');
      expect(children[1]).toHaveClass('items-center');
      expect(children[1]).toHaveClass('justify-center');
      
      // Right bell
      expect(children[2]).toHaveClass('flex');
      expect(children[2]).toHaveClass('items-center');
    });

    it('should have correct spacing for left navigation in non-project mode', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const leftNav = screen.getByTestId('icon-BurgerMenu').parentElement?.parentElement;
      expect(leftNav).toHaveClass('flex');
      expect(leftNav).toHaveClass('items-center');
    });

    it('should have correct spacing for left navigation in project mode', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const leftNav = screen.getByRole('button').parentElement;
      expect(leftNav).toHaveClass('flex');
      expect(leftNav).toHaveClass('items-center');
    });
  });

  describe('State Management', () => {
    it('should initialize menu state as closed', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should toggle menu state correctly', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      
      // Initial state: closed
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      
      // After first click: open
      await user.click(burgerMenu!);
      expect(screen.getByText('Home')).toBeInTheDocument();
      
      // After second click: closed
      await user.click(burgerMenu!);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should maintain menu state during re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      
      // Open menu
      await user.click(burgerMenu!);
      expect(screen.getByText('Home')).toBeInTheDocument();
      
      // Re-render
      rerender(<LayoutHeader />);
      
      // Menu should still be open
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should have clickable burger menu', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      expect(burgerMenu).toHaveClass('cursor-pointer');
    });

    it('should have clickable back button in project mode', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });

    it('should have proper navigation links', async () => {
      const user = userEvent.setup();
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
      await user.click(burgerMenu!);
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(8); // 7 menu links + 1 logo link
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projectId string', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<LayoutHeader projectId="" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      expect(consoleSpy).toHaveBeenCalledWith('isProjectFlow:', false);
      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle undefined onBack prop', () => {
      render(<LayoutHeader projectId="test-project" />, { wrapper: createWrapper() });
      
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
      
      // Should not crash when clicked
      expect(() => {
        fireEvent.click(backButton);
      }).not.toThrow();
    });

    it('should handle null projectId', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<LayoutHeader projectId={null} onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      expect(consoleSpy).toHaveBeenCalledWith('isProjectFlow:', false);
      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle undefined projectId', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<LayoutHeader projectId={undefined} onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      expect(consoleSpy).toHaveBeenCalledWith('isProjectFlow:', false);
      expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('px-6'); // Responsive padding
    });

    it('should have proper backdrop blur for modern browsers', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('backdrop-blur-sm');
    });
  });

  describe('Icon Integration', () => {
    it('should pass correct props to Icon components', () => {
      render(<LayoutHeader />, { wrapper: createWrapper() });
      
      const burgerIcon = screen.getByTestId('icon-BurgerMenu');
      expect(burgerIcon).toHaveAttribute('data-class', 'fill-white dark:fill-white');
      
      const bellIcon = screen.getByTestId('icon-Bell');
      expect(bellIcon).toHaveAttribute('data-class', 'fill-white dark:fill-white');
    });

    it('should pass correct props to ArrowLeft icon in project mode', () => {
      render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />, { wrapper: createWrapper() });
      
      const arrowIcon = screen.getByTestId('icon-ArrowLeft');
      expect(arrowIcon).toHaveAttribute('data-size', '30');
      expect(arrowIcon).toHaveAttribute('data-color', 'currentColor');
    });
  });
}); 