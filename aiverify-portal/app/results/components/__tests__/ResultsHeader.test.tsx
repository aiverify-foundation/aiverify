import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsHeader from '../ResultsHeader';

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
  Icon: ({ name, svgClassName }: { name: string; svgClassName?: string }) => (
    <div data-testid={`icon-${name}`} className={svgClassName}>
      Icon: {name}
    </div>
  ),
  IconName: {
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

describe('ResultsHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ResultsHeader />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
  });

  it('displays the logo with correct attributes', () => {
    render(<ResultsHeader />);
    
    const logo = screen.getByTestId('logo-image');
    expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
    expect(logo).toHaveAttribute('alt', 'AI Verify');
    expect(logo).toHaveAttribute('width', '250');
    expect(logo).toHaveAttribute('height', '40');
  });

  it('renders burger menu icon', () => {
    render(<ResultsHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    expect(burgerIcon).toBeInTheDocument();
    expect(burgerIcon).toHaveClass('fill-white', 'dark:fill-white');
  });

  it('renders bell icon', () => {
    render(<ResultsHeader />);
    
    const bellIcon = screen.getByTestId('icon-Bell');
    expect(bellIcon).toBeInTheDocument();
    expect(bellIcon).toHaveClass('fill-white', 'dark:fill-white');
  });

  it('toggles menu when burger icon is clicked', () => {
    render(<ResultsHeader />);
    
    // Find the burger button container by looking for the div that contains the icon and has the correct classes
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
    render(<ResultsHeader />);
    
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
    render(<ResultsHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    // Use getAllByTestId to get all links with the same testid
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
    render(<ResultsHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const homeLinks = screen.getAllByTestId('link-home');
    const menuHomeLink = homeLinks.find(link => link.textContent === 'Home');
    expect(menuHomeLink).toHaveClass('block', 'hover:text-secondary-300');
  });

  it('applies correct styling to menu items', () => {
    render(<ResultsHeader />);
    
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
    render(<ResultsHeader />);
    
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
    render(<ResultsHeader />);
    
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
    render(<ResultsHeader />);
    
    const header = screen.getByTestId('icon-BurgerMenu').closest('header');
    expect(header?.tagName).toBe('HEADER');
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
  });

  it('handles multiple rapid menu toggles', () => {
    render(<ResultsHeader />);
    
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
    render(<ResultsHeader />);
    
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
    render(<ResultsHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    expect(burgerButton).toHaveClass('relative', 'flex', 'cursor-pointer', 'items-center');
    // The onClick is handled by the component internally, not as a DOM attribute
  });

  it('has proper z-index layering', () => {
    render(<ResultsHeader />);
    
    const header = screen.getByTestId('icon-BurgerMenu').closest('header');
    expect(header).toHaveClass('z-50');
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    const burgerButton = burgerIcon.parentElement;
    fireEvent.click(burgerButton!);
    
    const menuContainer = screen.getByText('Home').closest('div');
    expect(menuContainer).toHaveClass('z-[100]');
  });
}); 