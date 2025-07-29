import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayoutHeader from '../LayoutHeader';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        data-testid="mock-image"
        {...props}
      />
    );
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, svgClassName }: any) => (
    <div data-testid={`icon-${name}`} className={svgClassName}>
      {name}
    </div>
  ),
  IconName: {
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell',
  },
}));

describe('LayoutHeader', () => {
  beforeEach(() => {
    // Clear any previous state
    jest.clearAllMocks();
  });

  it('renders the header with all main elements', () => {
    render(<LayoutHeader />);
    
    // Check for burger menu icon
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    
    // Check for logo
    expect(screen.getByTestId('mock-image')).toBeInTheDocument();
    expect(screen.getByAltText('AI Verify')).toBeInTheDocument();
    
    // Check for bell icon
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
  });

  it('applies correct CSS classes to header', () => {
    render(<LayoutHeader />);
    
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

  it('toggles menu when burger icon is clicked', () => {
    render(<LayoutHeader />);
    
    // Menu should be closed initially
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Click burger menu
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    fireEvent.click(burgerIcon!);
    
    // Menu should be open
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Report Templates')).toBeInTheDocument();
  });

  it('closes menu when burger icon is clicked again', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    
    // Open menu
    fireEvent.click(burgerIcon!);
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Close menu
    fireEvent.click(burgerIcon!);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('renders all navigation links with correct hrefs', () => {
    render(<LayoutHeader />);
    
    // Open menu first
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    fireEvent.click(burgerIcon!);
    
    // Check all navigation links
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/home');
    expect(screen.getByText('Model').closest('a')).toHaveAttribute('href', '/models');
    expect(screen.getByText('Data').closest('a')).toHaveAttribute('href', '/datasets');
    expect(screen.getByText('Results').closest('a')).toHaveAttribute('href', '/results');
    expect(screen.getByText('Inputs').closest('a')).toHaveAttribute('href', '/inputs');
    expect(screen.getByText('Plugins').closest('a')).toHaveAttribute('href', '/plugins');
    expect(screen.getByText('Report Templates').closest('a')).toHaveAttribute('href', '/templates');
  });

  it('renders logo with correct properties', () => {
    render(<LayoutHeader />);
    
    const logo = screen.getByTestId('mock-image');
    expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
    expect(logo).toHaveAttribute('alt', 'AI Verify');
    expect(logo).toHaveAttribute('width', '250');
    expect(logo).toHaveAttribute('height', '40');
  });

  it('applies correct CSS classes to menu dropdown', () => {
    render(<LayoutHeader />);
    
    // Open menu
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
    render(<LayoutHeader />);
    
    // Open menu
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    fireEvent.click(burgerIcon!);
    
    const menuItems = screen.getAllByRole('listitem');
    menuItems.forEach((item, index) => {
      if (index < menuItems.length - 1) {
        // All items except the last one should have border-b class
        expect(item).toHaveClass('border-b', 'border-secondary-300', 'py-2');
      } else {
        // Last item should only have py-2 class
        expect(item).toHaveClass('py-2');
        expect(item).not.toHaveClass('border-b', 'border-secondary-300');
      }
    });
  });

  it('applies hover effects to menu links', () => {
    render(<LayoutHeader />);
    
    // Open menu
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    fireEvent.click(burgerIcon!);
    
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('block', 'hover:text-secondary-300');
  });

  it('renders burger icon with correct styling', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu');
    expect(burgerIcon).toHaveClass('fill-white', 'dark:fill-white');
  });

  it('renders bell icon with correct styling', () => {
    render(<LayoutHeader />);
    
    const bellIcon = screen.getByTestId('icon-Bell');
    expect(bellIcon).toHaveClass('fill-white', 'dark:fill-white');
  });

  it('has proper z-index layering', () => {
    render(<LayoutHeader />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('z-50');
    
    // Open menu to check dropdown z-index
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    fireEvent.click(burgerIcon!);
    
    const menuDropdown = screen.getByText('Home').closest('div');
    expect(menuDropdown).toHaveClass('z-[100]');
  });

  it('maintains menu state correctly', () => {
    render(<LayoutHeader />);
    
    const burgerIcon = screen.getByTestId('icon-BurgerMenu').parentElement;
    
    // Menu should start closed
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Open menu
    fireEvent.click(burgerIcon!);
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Menu should stay open until clicked again
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Close menu
    fireEvent.click(burgerIcon!);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('renders without crashing when no interactions occur', () => {
    render(<LayoutHeader />);
    
    // Should render all static elements
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.getByTestId('mock-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
  });
}); 