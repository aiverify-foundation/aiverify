import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayoutHeader from '../LayoutHeader';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height }: any) {
    return <img src={src} alt={alt} width={width} height={height} data-testid="logo-image" />;
  };
});

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: any) {
    return <a href={href} data-testid={`link-${href}`} className={className}>{children}</a>;
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, svgClassName, onClick }: any) => (
    <div
      data-testid={`icon-${name}`}
      onClick={onClick}
      style={{ fontSize: size, color }}
      className={svgClassName}
    >
      {name}
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

  it('renders the component with logo and bell icon', () => {
    render(<LayoutHeader />);
    
    expect(screen.getByTestId('logo-image')).toBeInTheDocument();
    expect(screen.getByTestId('logo-image')).toHaveAttribute('src', '/aiverify-logo-white.svg');
    expect(screen.getByTestId('logo-image')).toHaveAttribute('alt', 'AI Verify');
    expect(screen.getByTestId('icon-Bell')).toBeInTheDocument();
  });

  it('renders burger menu when no projectId is provided', () => {
    render(<LayoutHeader />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
    expect(screen.queryByText('Back to Project')).not.toBeInTheDocument();
  });

  it('renders back button when projectId is provided', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
    expect(screen.getByText('Back to Project')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-BurgerMenu')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByTestId('icon-ArrowLeft'));
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when "Back to Project" text is clicked', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByText('Back to Project'));
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('toggles menu when burger menu is clicked', () => {
    render(<LayoutHeader />);
    
    // Menu should be closed initially
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Click burger menu to open
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    
    // Menu should be open
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Report Templates')).toBeInTheDocument();
  });

  it('closes menu when burger menu is clicked again', () => {
    render(<LayoutHeader />);
    
    // Open menu
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Close menu
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('renders all navigation links in menu', () => {
    render(<LayoutHeader />);
    
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    
    const homeLinks = screen.getAllByTestId('link-/home');
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(screen.getByTestId('link-/models')).toBeInTheDocument();
    expect(screen.getByTestId('link-/datasets')).toBeInTheDocument();
    expect(screen.getByTestId('link-/results')).toBeInTheDocument();
    expect(screen.getByTestId('link-/inputs')).toBeInTheDocument();
    expect(screen.getByTestId('link-/plugins')).toBeInTheDocument();
    expect(screen.getByTestId('link-/templates')).toBeInTheDocument();
  });

  it('renders logo as a link to home', () => {
    render(<LayoutHeader />);
    
    expect(screen.getByTestId('link-/home')).toBeInTheDocument();
    expect(screen.getByTestId('logo-image')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
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

  it('applies correct styling to back button container', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    const backButton = screen.getByTestId('icon-ArrowLeft').parentElement;
    expect(backButton).toHaveClass(
      'flex',
      'items-center',
      'gap-2',
      'text-white',
      'hover:text-primary-300'
    );
  });

  it('applies correct styling to burger menu container', () => {
    render(<LayoutHeader />);
    
    const burgerMenu = screen.getByTestId('icon-BurgerMenu').parentElement;
    expect(burgerMenu).toHaveClass(
      'relative',
      'flex',
      'cursor-pointer',
      'items-center'
    );
  });

  it('applies correct styling to menu dropdown', () => {
    render(<LayoutHeader />);
    
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    
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

  it('applies correct styling to menu items', () => {
    render(<LayoutHeader />);
    
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    
    const menuItems = screen.getAllByRole('listitem');
    // Check that most items have the border styling
    menuItems.slice(0, -1).forEach(item => {
      expect(item).toHaveClass('border-b', 'border-secondary-300', 'py-2');
    });
    
    // Last item (Report Templates) should not have border-b
    const lastItem = screen.getByText('Report Templates').closest('li');
    expect(lastItem).toHaveClass('py-2');
    expect(lastItem).not.toHaveClass('border-b');
  });

  it('applies correct styling to menu links', () => {
    render(<LayoutHeader />);
    
    fireEvent.click(screen.getByTestId('icon-BurgerMenu'));
    
    // Check specific menu links by their href attributes
    const homeLink = screen.getByRole('link', { name: 'Home' });
    const modelLink = screen.getByRole('link', { name: 'Model' });
    const dataLink = screen.getByRole('link', { name: 'Data' });
    
    expect(homeLink).toHaveClass('block', 'hover:text-secondary-300');
    expect(modelLink).toHaveClass('block', 'hover:text-secondary-300');
    expect(dataLink).toHaveClass('block', 'hover:text-secondary-300');
  });

  it('applies correct styling to logo container', () => {
    render(<LayoutHeader />);
    
    const logoContainer = screen.getByTestId('logo-image').closest('div');
    expect(logoContainer).toHaveClass(
      'flex',
      'flex-grow',
      'items-center',
      'justify-center'
    );
  });

  it('applies correct styling to bell icon container', () => {
    render(<LayoutHeader />);
    
    const bellContainer = screen.getByTestId('icon-Bell').parentElement;
    // The bell icon container should have the flex items-center classes
    expect(bellContainer).toHaveClass('flex', 'items-center');
  });

  it('does not show menu when projectId is provided', () => {
    render(<LayoutHeader projectId="test-project" onBack={mockOnBack} />);
    
    // Should not be able to open menu
    expect(screen.queryByTestId('icon-BurgerMenu')).not.toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('handles missing onBack prop gracefully', () => {
    render(<LayoutHeader projectId="test-project" />);
    
    // Should not throw error when clicking back button without onBack prop
    fireEvent.click(screen.getByTestId('icon-ArrowLeft'));
    fireEvent.click(screen.getByText('Back to Project'));
  });

  it('renders with null projectId', () => {
    render(<LayoutHeader projectId={null} />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
  });

  it('renders with undefined projectId', () => {
    render(<LayoutHeader projectId={undefined} />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
  });

  it('renders with empty string projectId', () => {
    render(<LayoutHeader projectId="" />);
    
    expect(screen.getByTestId('icon-BurgerMenu')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
  });
}); 