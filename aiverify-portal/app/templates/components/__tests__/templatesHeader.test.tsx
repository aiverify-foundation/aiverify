import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplatesHeader from '../templatesHeader';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        data-testid="next-image"
        {...props}
      />
    );
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, className, ...props }: any) {
    return (
      <a href={href} className={className} data-testid={`link-${href.replace('/', '')}`} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: function MockIcon({ name, svgClassName, ...props }: any) {
    return (
      <div
        data-testid={`icon-${name.toLowerCase()}`}
        data-svg-class-name={svgClassName}
        {...props}
      />
    );
  },
  IconName: {
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

describe('TemplatesHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with correct structure', () => {
    render(<TemplatesHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('icon-burgermenu')).toBeInTheDocument();
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
  });

  it('should have correct header styling', () => {
    render(<TemplatesHeader />);

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

  it('should render logo with correct attributes', () => {
    render(<TemplatesHeader />);

    const logo = screen.getByTestId('next-image');
    expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
    expect(logo).toHaveAttribute('alt', 'AI Verify');
    expect(logo).toHaveAttribute('width', '250');
    expect(logo).toHaveAttribute('height', '40');
  });

  it('should wrap logo with link to home', () => {
    render(<TemplatesHeader />);

    const homeLink = screen.getByTestId('link-home');
    const logo = screen.getByTestId('next-image');
    
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toContainElement(logo);
    expect(homeLink).toHaveAttribute('href', '/home');
  });

  describe('Menu toggle functionality', () => {
    it('should not show menu dropdown initially', () => {
      render(<TemplatesHeader />);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should show menu dropdown when burger icon is clicked', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should hide menu dropdown when burger icon is clicked again', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      
      // Open menu
      fireEvent.click(burgerIcon!);
      expect(screen.getByRole('list')).toBeInTheDocument();

      // Close menu
      fireEvent.click(burgerIcon!);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should toggle menu state correctly', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      
      // Initially closed
      expect(screen.queryByRole('list')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(burgerIcon!);
      expect(screen.getByRole('list')).toBeInTheDocument();

      // Click to close
      fireEvent.click(burgerIcon!);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();

      // Click to open again
      fireEvent.click(burgerIcon!);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Navigation menu', () => {
    beforeEach(() => {
      render(<TemplatesHeader />);
      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);
    });

    it('should render all navigation links', () => {
      const expectedLinks = [
        { href: '/home', text: 'Home' },
        { href: '/models', text: 'Model' },
        { href: '/datasets', text: 'Data' },
        { href: '/results', text: 'Results' },
        { href: '/inputs', text: 'Inputs' },
        { href: '/plugins', text: 'Plugins' },
        { href: '/templates', text: 'Report Templates' },
      ];

      expectedLinks.forEach(({ href, text }) => {
        expect(screen.getByRole('link', { name: text })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: text })).toHaveAttribute('href', href);
      });
    });

    it('should have correct menu dropdown styling', () => {
      const menuDropdown = screen.getByRole('list').parentElement;
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

    it('should style navigation links correctly', () => {
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('block', 'hover:text-secondary-300');
    });

    it('should have proper list item structure', () => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(7);

      // Check that most items have border-bottom except the last one
      listItems.slice(0, -1).forEach((item) => {
        expect(item).toHaveClass('border-b', 'border-secondary-300', 'py-2');
      });

      // Last item should not have border-bottom
      const lastItem = listItems[listItems.length - 1];
      expect(lastItem).toHaveClass('py-2');
      expect(lastItem).not.toHaveClass('border-b');
    });
  });

  describe('Burger menu icon', () => {
    it('should render burger menu icon with correct styling', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu');
      expect(burgerIcon).toHaveAttribute('data-svg-class-name', 'fill-white dark:fill-white');
    });

    it('should have cursor pointer styling on burger menu container', () => {
      render(<TemplatesHeader />);

      const burgerContainer = screen.getByTestId('icon-burgermenu').parentElement;
      expect(burgerContainer).toHaveClass('relative', 'flex', 'cursor-pointer', 'items-center');
    });

    it('should be clickable', () => {
      render(<TemplatesHeader />);

      const burgerContainer = screen.getByTestId('icon-burgermenu').parentElement;
      expect(burgerContainer).toBeInTheDocument();
      
      fireEvent.click(burgerContainer!);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Bell icon', () => {
    it('should render bell icon with correct styling', () => {
      render(<TemplatesHeader />);

      const bellIcon = screen.getByTestId('icon-bell');
      expect(bellIcon).toHaveAttribute('data-svg-class-name', 'fill-white dark:fill-white');
    });

    it('should be wrapped in proper container', () => {
      render(<TemplatesHeader />);

      const bellContainer = screen.getByTestId('icon-bell').parentElement;
      expect(bellContainer).toHaveClass('flex', 'items-center');
    });
  });

  describe('Layout structure', () => {
    it('should have proper flex layout', () => {
      render(<TemplatesHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('flex', 'items-center');
    });

    it('should center the logo', () => {
      render(<TemplatesHeader />);

      const logoContainer = screen.getByTestId('next-image').parentElement?.parentElement;
      expect(logoContainer).toHaveClass('flex', 'flex-grow', 'items-center', 'justify-center');
    });

    it('should position burger menu on the left', () => {
      render(<TemplatesHeader />);

      const burgerContainer = screen.getByTestId('icon-burgermenu').parentElement;
      const header = screen.getByRole('banner');
      
      expect(header.firstElementChild).toBe(burgerContainer);
    });

    it('should position bell icon on the right', () => {
      render(<TemplatesHeader />);

      const bellContainer = screen.getByTestId('icon-bell').parentElement;
      const header = screen.getByRole('banner');
      
      expect(header.lastElementChild).toBe(bellContainer);
    });
  });

  describe('Accessibility', () => {
    it('should have proper header role', () => {
      render(<TemplatesHeader />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have accessible navigation when menu is open', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(7);
    });

    it('should have accessible links with proper text', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAccessibleName('Home');
    });

    it('should have accessible logo link', () => {
      render(<TemplatesHeader />);

      const logoLink = screen.getByTestId('link-home');
      expect(logoLink).toHaveAttribute('href', '/home');
    });
  });

  describe('Responsive behavior', () => {
    it('should position menu dropdown correctly', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);

      const menuDropdown = screen.getByRole('list').parentElement;
      expect(menuDropdown).toHaveClass('absolute', 'left-6', 'top-20');
    });

    it('should have proper z-index for menu dropdown', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);

      const menuDropdown = screen.getByRole('list').parentElement;
      expect(menuDropdown).toHaveClass('z-[100]');
    });

    it('should have proper z-index for header', () => {
      render(<TemplatesHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-50');
    });
  });

  describe('Menu state management', () => {
    it('should initialize with closed menu', () => {
      render(<TemplatesHeader />);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should maintain menu state across multiple toggles', () => {
      render(<TemplatesHeader />);

      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      
      // First toggle cycle
      fireEvent.click(burgerIcon!);
      expect(screen.getByRole('list')).toBeInTheDocument();
      
      fireEvent.click(burgerIcon!);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();

      // Second toggle cycle
      fireEvent.click(burgerIcon!);
      expect(screen.getByRole('list')).toBeInTheDocument();
      
      fireEvent.click(burgerIcon!);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Navigation links detail', () => {
    beforeEach(() => {
      render(<TemplatesHeader />);
      const burgerIcon = screen.getByTestId('icon-burgermenu').parentElement;
      fireEvent.click(burgerIcon!);
    });

    it('should have home link with correct href', () => {
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('href', '/home');
    });

    it('should have models link with correct href', () => {
      const modelsLink = screen.getByRole('link', { name: 'Model' });
      expect(modelsLink).toHaveAttribute('href', '/models');
    });

    it('should have datasets link with correct href', () => {
      const datasetsLink = screen.getByRole('link', { name: 'Data' });
      expect(datasetsLink).toHaveAttribute('href', '/datasets');
    });

    it('should have results link with correct href', () => {
      const resultsLink = screen.getByRole('link', { name: 'Results' });
      expect(resultsLink).toHaveAttribute('href', '/results');
    });

    it('should have inputs link with correct href', () => {
      const inputsLink = screen.getByRole('link', { name: 'Inputs' });
      expect(inputsLink).toHaveAttribute('href', '/inputs');
    });

    it('should have plugins link with correct href', () => {
      const pluginsLink = screen.getByRole('link', { name: 'Plugins' });
      expect(pluginsLink).toHaveAttribute('href', '/plugins');
    });

    it('should have templates link with correct href', () => {
      const templatesLink = screen.getByRole('link', { name: 'Report Templates' });
      expect(templatesLink).toHaveAttribute('href', '/templates');
    });
  });
}); 