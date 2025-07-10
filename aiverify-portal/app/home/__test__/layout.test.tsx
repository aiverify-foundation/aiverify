import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import HomeLayout from '../layout';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock globals.css
jest.mock('@/app/globals.css', () => ({}));

describe('HomeLayout', () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with children', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header with logo and navigation icons', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    // Check for AI Verify logo
    const logo = screen.getByAltText('AI Verify');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
    
    // Check for burger menu icon (look for the clickable div with cursor-pointer class)
    const burgerMenuContainer = document.querySelector('.cursor-pointer');
    expect(burgerMenuContainer).toBeInTheDocument();
    
    // Check for bell icon container (look for the icon_wrapper divs)
    const iconWrappers = document.querySelectorAll('.icon_wrapper');
    expect(iconWrappers.length).toBeGreaterThanOrEqual(2); // Burger menu and bell icons
  });

  it('toggles menu when burger icon is clicked', async () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerIcon = document.querySelector('.cursor-pointer');
    
    // Menu should not be visible initially
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Click burger icon to open menu
    fireEvent.click(burgerIcon!);
    
    // Menu should now be visible
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
    
    // Click again to close menu
    fireEvent.click(burgerIcon!);
    
    await waitFor(() => {
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  it('renders all navigation menu items when menu is open', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerIcon = document.querySelector('.cursor-pointer');
    fireEvent.click(burgerIcon!);
    
    // Check all menu items are present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Report Templates')).toBeInTheDocument();
  });

  it('renders correct navigation links', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerIcon = document.querySelector('.cursor-pointer');
    fireEvent.click(burgerIcon!);
    
    // Check navigation links
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('link', { name: 'Model' })).toHaveAttribute('href', '/models');
    expect(screen.getByRole('link', { name: 'Data' })).toHaveAttribute('href', '/datasets');
    expect(screen.getByRole('link', { name: 'Results' })).toHaveAttribute('href', '/results');
    expect(screen.getByRole('link', { name: 'Inputs' })).toHaveAttribute('href', '/inputs');
    expect(screen.getByRole('link', { name: 'Plugins' })).toHaveAttribute('href', '/plugins');
    expect(screen.getByRole('link', { name: 'Report Templates' })).toHaveAttribute('href', '/templates');
  });

  it('logo links to home page', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const logoLink = screen.getByRole('link', { name: 'AI Verify' });
    expect(logoLink).toHaveAttribute('href', '/home');
  });

  it('applies correct CSS classes to header', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-primary-950/100', 'fixed', 'left-0', 'right-0', 'top-0', 'z-50');
  });

  it('applies correct CSS classes to main content', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('mx-auto', 'px-4', 'pt-[64px]');
  });

  it('has proper accessibility attributes', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    // Check for proper semantic HTML
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    
    // Check logo has proper alt text
    expect(screen.getByAltText('AI Verify')).toBeInTheDocument();
  });

  it('menu has proper styling when open', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerIcon = document.querySelector('.cursor-pointer');
    fireEvent.click(burgerIcon!);
    
    const menu = screen.getByText('Home').closest('div');
    expect(menu).toHaveClass('absolute', 'left-6', 'top-20', 'z-[100]');
  });

  it('burger menu is clickable and has cursor pointer', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerContainer = document.querySelector('.cursor-pointer');
    expect(burgerContainer).toHaveClass('cursor-pointer');
  });

  it('menu items have hover effects', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerIcon = document.querySelector('.cursor-pointer');
    fireEvent.click(burgerIcon!);
    
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveClass('hover:text-secondary-300');
  });

  it('handles multiple menu toggles correctly', () => {
    render(<HomeLayout>{mockChildren}</HomeLayout>);
    
    const burgerIcon = document.querySelector('.cursor-pointer');
    
    // Test multiple toggles
    fireEvent.click(burgerIcon!);
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    fireEvent.click(burgerIcon!);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    fireEvent.click(burgerIcon!);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
}); 