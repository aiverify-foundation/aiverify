import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayoutHeader from '../LayoutHeader';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height }: any) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        data-testid="header-logo"
      />
    );
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return (
      <a href={href} data-href={href}>
        {children}
      </a>
    );
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, svgClassName, role, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid={`icon-${name}`}
      className={svgClassName}
      role={role}
      aria-label={ariaLabel}
    >
      {name} Icon
    </div>
  ),
  IconName: {
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

describe('LayoutHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<LayoutHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('has correct accessibility attributes for the header', () => {
      render(<LayoutHeader />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveAttribute('aria-label', 'Main header');
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

    it('renders burger menu icon', () => {
      render(<LayoutHeader />);
      
      const burgerIcon = screen.getByTestId('icon-BurgerMenu');
      expect(burgerIcon).toBeInTheDocument();
      expect(burgerIcon).toHaveClass('fill-white', 'dark:fill-white');
    });

    it('renders notification bell icon', () => {
      render(<LayoutHeader />);
      
      const bellIcon = screen.getByTestId('icon-Bell');
      expect(bellIcon).toBeInTheDocument();
      expect(bellIcon).toHaveClass('fill-white', 'dark:fill-white');
      expect(bellIcon).toHaveAttribute('aria-label', 'Notification icon');
    });

    it('renders logo with correct attributes', () => {
      render(<LayoutHeader />);
      
      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
      expect(logo).toHaveAttribute('alt', 'AI Verify Logo');
      expect(logo).toHaveAttribute('width', '250');
      expect(logo).toHaveAttribute('height', '40');
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('starts with menu closed', () => {
      render(<LayoutHeader />);
      
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
    });

    it('opens menu when burger icon is clicked', () => {
      render(<LayoutHeader />);
      
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      fireEvent.click(burgerButton);
      
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
    });

    it('closes menu when burger icon is clicked again', () => {
      render(<LayoutHeader />);
      
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      
      // Open menu
      fireEvent.click(burgerButton);
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
      
      // Close menu
      fireEvent.click(burgerButton);
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
    });

    it('burger button has correct accessibility attributes', () => {
      render(<LayoutHeader />);
      
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      expect(burgerButton).toHaveAttribute('aria-label', 'Toggle navigation menu');
      expect(burgerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when menu is opened', () => {
      render(<LayoutHeader />);
      
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      fireEvent.click(burgerButton);
      
      expect(burgerButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Navigation Menu', () => {
    beforeEach(() => {
      render(<LayoutHeader />);
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      fireEvent.click(burgerButton);
    });

    it('renders navigation menu with correct accessibility attributes', () => {
      const menu = screen.getByLabelText('Navigation menu');
      expect(menu).toHaveAttribute('aria-label', 'Navigation menu');
      expect(menu).toHaveClass(
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

    it('renders all navigation menu items', () => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(5);
      
      const expectedItems = [
        'Home',
        'Model',
        'Data',
        'Plugins',
        'Report Templates',
      ];
      
      expectedItems.forEach((itemText, index) => {
        expect(menuItems[index]).toHaveTextContent(itemText);
      });
    });

    it('renders menu items with correct links', () => {
      const expectedLinks = [
        { text: 'Home', href: '/home' },
        { text: 'Model', href: '/models' },
        { text: 'Data', href: '/datasets' },
        { text: 'Results', href: '/results' },
        { text: 'Inputs', href: '/inputs' },
        { text: 'Plugins', href: '/plugins' },
        { text: 'Report Templates', href: '/templates' },
      ];
      
      expectedLinks.forEach(({ text, href }) => {
        const link = screen.getByRole('link', { name: text });
        expect(link).toHaveAttribute('data-href', href);
      });
    });

    it('menu items have correct styling', () => {
      const menuItems = screen.getAllByRole('menuitem');
      
      menuItems.forEach((item, index) => {
        if (index < menuItems.length - 1) {
          // All items except the last should have border-bottom
          expect(item).toHaveClass('border-b', 'border-secondary-300', 'py-2');
        } else {
          // Last item should not have border-bottom
          expect(item).toHaveClass('py-2');
          expect(item).not.toHaveClass('border-b');
        }
      });
    });

    it('menu links have correct structure', () => {
      const links = screen.getAllByRole('link');
      
      // Check that menu links exist
      const menuLinks = links.filter(link => {
        const href = link.getAttribute('data-href');
        return href && ['/home', '/models', '/datasets', '/results', '/inputs', '/plugins', '/templates'].includes(href);
      });
      
      expect(menuLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Logo Navigation', () => {
    it('logo is wrapped in a link to home', () => {
      render(<LayoutHeader />);
      
      const logoLink = screen.getByRole('link', { name: 'AI Verify Logo' });
      expect(logoLink).toHaveAttribute('data-href', '/home');
      
      const logo = screen.getByTestId('header-logo');
      expect(logoLink).toContainElement(logo);
    });

    it('logo container has correct styling', () => {
      render(<LayoutHeader />);
      
      const logoContainer = screen.getByTestId('header-logo').closest('div');
      expect(logoContainer).toHaveClass('flex', 'flex-grow', 'items-center', 'justify-center');
    });
  });

  describe('Layout and Positioning', () => {
    it('header is fixed positioned', () => {
      render(<LayoutHeader />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed', 'left-0', 'right-0', 'top-0', 'z-50');
    });

    it('has correct height and spacing', () => {
      render(<LayoutHeader />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('h-16', 'px-6');
    });

    it('has correct background and border styling', () => {
      render(<LayoutHeader />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass(
        'border-b',
        'border-primary-700',
        'bg-primary-950',
        'backdrop-blur-sm'
      );
    });
  });

  describe('Responsive Behavior', () => {
    it('burger menu icon has correct cursor style', () => {
      render(<LayoutHeader />);
      
      const burgerContainer = screen.getByRole('button', { name: 'Toggle navigation menu' });
      expect(burgerContainer).toHaveClass('relative', 'flex', 'cursor-pointer', 'items-center');
    });

    it('notification bell is positioned correctly', () => {
      render(<LayoutHeader />);
      
      const bellIcon = screen.getByTestId('icon-Bell');
      const bellContainer = bellIcon.parentElement;
      expect(bellContainer).toHaveClass('flex', 'items-center');
    });
  });

  describe('Accessibility', () => {
    it('has proper landmark structure', () => {
      render(<LayoutHeader />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('provides accessible navigation', () => {
      render(<LayoutHeader />);
      
      // Open menu to check navigation accessibility
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      fireEvent.click(burgerButton);
      
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(5);
    });

    it('notification icon has proper ARIA label', () => {
      render(<LayoutHeader />);
      
      const bellIcon = screen.getByTestId('icon-Bell');
      expect(bellIcon).toHaveAttribute('aria-label', 'Notification icon');
      expect(bellIcon).toHaveAttribute('role', 'img');
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple rapid clicks on burger menu', () => {
      render(<LayoutHeader />);
      
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      
      // Test toggle behavior
      fireEvent.click(burgerButton);
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
      
      fireEvent.click(burgerButton);
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
      
      fireEvent.click(burgerButton);
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
    });

    it('menu behavior works correctly', () => {
      const { rerender } = render(<LayoutHeader />);
      
      const burgerButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      fireEvent.click(burgerButton);
      
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
      
      // Test that menu can be closed
      fireEvent.click(burgerButton);
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
    });
  });
}); 