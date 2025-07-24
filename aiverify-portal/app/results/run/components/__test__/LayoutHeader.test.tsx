import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayoutHeader from '../LayoutHeader';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height }: any) {
    return <img src={src} alt={alt} width={width} height={height} data-testid="logo-image" />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props} data-testid={`link-${href.replace('/', '')}`}>{children}</a>;
  };
});

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, svgClassName }: { name: string; size?: number; color?: string; svgClassName?: string }) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color} className={svgClassName}>
      Icon: {name}
    </div>
  ),
  IconName: {
    ArrowLeft: 'ArrowLeft',
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

describe('LayoutHeader', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LayoutHeader />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
  });

  it('displays the logo with correct attributes', () => {
    render(<LayoutHeader />);
    
    const logo = screen.getByTestId('logo-image');
    expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
    expect(logo).toHaveAttribute('alt', 'AI Verify');
    expect(logo).toHaveAttribute('width', '250');
    expect(logo).toHaveAttribute('height', '40');
  });

  it('renders burger menu icon when not in project flow', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    expect(burgerIcon).toBeInTheDocument();
    expect(burgerIcon).toHaveClass('fill-white', 'dark:fill-white');
  });

  it('renders bell icon', () => {
    render(<LayoutHeader />);
    
    const bellIcon = screen.getByTestId('icon-Bell');
    expect(bellIcon).toBeInTheDocument();
    expect(bellIcon).toHaveClass('fill-white', 'dark:fill-white');
  });

  it('renders back button when in project flow', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
    expect(screen.getByText('Back to Project')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-BurgerMenu')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    const backButton = screen.getByText('Back to Project').closest('button');
    fireEvent.click(backButton!);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('toggles menu when burger icon is clicked', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    expect(burgerButton).toHaveClass('relative', 'flex', 'cursor-pointer', 'items-center');
    
    // Menu should be closed initially
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Click to open menu
    fireEvent.click(burgerButton!);
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Click again to close menu
    fireEvent.click(burgerButton!);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('displays all navigation links when menu is open', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const expectedLinks = [
      'Home',
      'Model',
      'Data',
      'Results',
      'Inputs',
      'Plugins',
      'Report Templates'
    ];
    
    expectedLinks.forEach(linkText => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });

  it('has correct navigation link URLs', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const homeLinks = screen.getAllByTestId('link-home');
    const menuHomeLink = homeLinks.find(link => link.textContent === 'Home');
    expect(menuHomeLink).toHaveAttribute('href', '/home');
    expect(screen.getByTestId('link-models')).toHaveAttribute('href', '/models');
    expect(screen.getByTestId('link-datasets')).toHaveAttribute('href', '/datasets');
    expect(screen.getByTestId('link-results')).toHaveAttribute('href', '/results');
    expect(screen.getByTestId('link-inputs')).toHaveAttribute('href', '/inputs');
    expect(screen.getByTestId('link-plugins')).toHaveAttribute('href', '/plugins');
    expect(screen.getByTestId('link-templates')).toHaveAttribute('href', '/templates');
  });

  it('applies correct styling to navigation links', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const homeLinks = screen.getAllByTestId('link-home');
    const menuHomeLink = homeLinks.find(link => link.textContent === 'Home');
    expect(menuHomeLink).toHaveClass('block', 'hover:text-secondary-300');
  });

  it('applies correct styling to menu items', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const menuItems = screen.getAllByRole('listitem');
    // All items except the last one should have border-b
    menuItems.slice(0, -1).forEach(item => {
      expect(item).toHaveClass('border-b', 'border-secondary-300', 'py-2');
    });
    
    // Last item should not have border-b
    const lastItem = menuItems[menuItems.length - 1];
    expect(lastItem).toHaveClass('py-2');
    expect(lastItem).not.toHaveClass('border-b');
  });

  it('applies correct styling to menu container', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const menuContainer = screen.getByText('Home').closest('div');
    expect(menuContainer).toHaveClass(
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

  it('has correct header styling', () => {
    render(<LayoutHeader />);
    
    const header = screen.getByTestId('icon-BurgerMenu').closest('header');
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

  it('has proper semantic structure', () => {
    render(<LayoutHeader />);
    
    const header = screen.getByTestId('icon-BurgerMenu').closest('header');
    expect(header?.tagName).toBe('HEADER');
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
  });

  it('handles multiple rapid menu toggles', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    
    // Rapid clicks
    fireEvent.click(burgerButton!);
    fireEvent.click(burgerButton!);
    fireEvent.click(burgerButton!);
    
    // Should end up in open state
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('maintains menu state correctly', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    
    // Open menu
    fireEvent.click(burgerButton!);
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Close menu
    fireEvent.click(burgerButton!);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Open again
    fireEvent.click(burgerButton!);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('has accessible burger menu button', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    expect(burgerButton).toHaveClass('relative', 'flex', 'cursor-pointer', 'items-center');
  });

  it('has proper z-index layering', () => {
    render(<LayoutHeader />);
    
    const header = screen.getByTestId('icon-BurgerMenu').closest('header');
    expect(header).toHaveClass('z-50');
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const menuContainer = screen.getByText('Home').closest('div');
    expect(menuContainer).toHaveClass('z-[100]');
  });

  it('handles missing onBack prop gracefully', () => {
    render(<LayoutHeader projectId="test-project" />);
    
    const backButton = screen.getByText('Back to Project').closest('button');
    expect(() => fireEvent.click(backButton!)).not.toThrow();
  });

  it('handles null projectId', () => {
    render(<LayoutHeader projectId={null} onBack={mockOnBack} />);
    
    // Should not render back button when projectId is null
    expect(screen.queryByText('Back to Project')).not.toBeInTheDocument();
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
  });

  it('handles undefined projectId', () => {
    render(<LayoutHeader projectId={undefined} onBack={mockOnBack} />);
    
    // Should not render back button when projectId is undefined
    expect(screen.queryByText('Back to Project')).not.toBeInTheDocument();
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
  });

  it('renders back button with correct styling', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    const backButton = screen.getByText('Back to Project').closest('button');
    expect(backButton).toHaveClass('flex', 'items-center', 'gap-2', 'text-white', 'hover:text-primary-300');
  });

  it('renders back arrow icon with correct props', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    const arrowIcon = screen.getByTestId('icon-ArrowLeft');
    expect(arrowIcon).toHaveAttribute('data-size', '30');
    expect(arrowIcon).toHaveAttribute('data-color', 'currentColor');
  });

  it('renders back text with correct styling', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    const backText = screen.getByText('Back to Project');
    expect(backText).toHaveClass('text-lg', 'font-semibold', 'text-white');
  });

  it('handles rapid back button clicks', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    const backButton = screen.getByText('Back to Project').closest('button');
    
    // Multiple rapid clicks
    fireEvent.click(backButton!);
    fireEvent.click(backButton!);
    fireEvent.click(backButton!);
    
    expect(mockOnBack).toHaveBeenCalledTimes(3);
  });

  it('has proper logo link', () => {
    render(<LayoutHeader />);
    
    const logoLink = screen.getByTestId('logo-image').closest('a');
    expect(logoLink).toHaveAttribute('href', '/home');
  });

  it('maintains layout structure in both modes', () => {
    // Test non-project flow
    const { rerender } = render(<LayoutHeader />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
    
    // Test project flow
    rerender(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
    expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
  });
}); 