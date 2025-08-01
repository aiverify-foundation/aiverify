import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DatasetsHeader from '../DatasetsHeader';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} data-testid="logo" {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, svgClassName }: any) => (
    <div className="icon_wrapper" style={{ width: '20px', height: '20px' }}>
      <svg 
        className={svgClassName}
        width="20" 
        height="20" 
        viewBox={name === 'BurgerMenu' ? '0 0 12 12' : '0 0 37 40'}
        fill="#000000"
        stroke="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {name === 'BurgerMenu' ? (
          <g>
            <rect height="1" width="11" x="0.5" y="0" />
            <rect height="1" width="11" x="0.5" y="4.2" />
            <rect height="1" width="11" x="0.5" y="8.5" />
          </g>
        ) : (
          <>
            <path d="M14.016 3.43405C14.6733 1.43964 16.5515 0 18.766 0C20.9805 0 22.8587 1.43964 23.516 3.43405C28.0637 5.30377 31.2659 9.77789 31.2659 14.9999V24.9998L36.6319 30.3658C37.4194 31.1533 36.8616 32.4998 35.7479 32.4998H1.78376C0.670138 32.4998 0.112417 31.1533 0.899862 30.3658L6.26608 24.9998V14.9999C6.26608 9.77789 9.46826 5.30377 14.016 3.43405Z" />
            <path d="M13.766 35C13.766 37.7615 16.0045 40 18.766 40C21.5275 40 23.766 37.7615 23.766 35H13.766Z" />
          </>
        )}
      </svg>
    </div>
  ),
  IconName: {
    BurgerMenu: 'BurgerMenu',
    Bell: 'Bell'
  }
}));

describe('DatasetsHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the header with logo', () => {
      render(<DatasetsHeader />);
      
      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
      expect(logo).toHaveAttribute('alt', 'AI Verify');
    });

    it('renders the burger menu icon', () => {
      render(<DatasetsHeader />);
      
      const burgerIcon = document.querySelector('.icon_wrapper svg');
      expect(burgerIcon).toBeInTheDocument();
    });

    it('renders the bell icon', () => {
      render(<DatasetsHeader />);
      
      const bellIcon = document.querySelectorAll('.icon_wrapper svg')[1];
      expect(bellIcon).toBeInTheDocument();
    });

    it('renders the home link', () => {
      render(<DatasetsHeader />);
      
      const homeLink = screen.getByRole('link', { name: 'AI Verify' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/home');
    });
  });

  describe('Menu Toggle', () => {
    it('toggles menu when burger icon is clicked', () => {
      render(<DatasetsHeader />);
      
      const burgerContainer = document.querySelector('.relative.flex.cursor-pointer.items-center');
      expect(burgerContainer).toBeInTheDocument();
      
      // Initially menu should not be visible
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      
      // Click burger icon
      fireEvent.click(burgerContainer!);
      
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
      render(<DatasetsHeader />);
      
      const burgerContainer = document.querySelector('.relative.flex.cursor-pointer.items-center');
      
      // Open menu
      fireEvent.click(burgerContainer!);
      expect(screen.getByText('Home')).toBeInTheDocument();
      
      // Close menu
      fireEvent.click(burgerContainer!);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders all navigation links when menu is open', () => {
      render(<DatasetsHeader />);
      
      const burgerContainer = document.querySelector('.relative.flex.cursor-pointer.items-center');
      fireEvent.click(burgerContainer!);
      
      const links = [
        { text: 'Home', href: '/home' },
        { text: 'Model', href: '/models' },
        { text: 'Data', href: '/datasets' },
        { text: 'Results', href: '/results' },
        { text: 'Inputs', href: '/inputs' },
        { text: 'Plugins', href: '/plugins' },
        { text: 'Report Templates', href: '/templates' }
      ];
      
      links.forEach(({ text, href }) => {
        const link = screen.getByText(text);
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', href);
      });
    });
  });

  describe('Styling', () => {
    it('has correct header styling', () => {
      render(<DatasetsHeader />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed', 'left-0', 'right-0', 'top-0', 'z-50', 'flex', 'h-16', 'items-center', 'border-b', 'border-primary-700', 'bg-primary-950', 'px-6', 'backdrop-blur-sm');
    });

    it('has correct logo container styling', () => {
      render(<DatasetsHeader />);
      
      const logoContainer = document.querySelector('.flex.flex-grow.items-center.justify-center');
      expect(logoContainer).toBeInTheDocument();
    });

    it('has correct bell icon container styling', () => {
      render(<DatasetsHeader />);
      
      const bellContainer = document.querySelector('.flex.items-center');
      expect(bellContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper header role', () => {
      render(<DatasetsHeader />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('has proper navigation structure when menu is open', () => {
      render(<DatasetsHeader />);
      
      const burgerContainer = document.querySelector('.relative.flex.cursor-pointer.items-center');
      fireEvent.click(burgerContainer!);
      
      // Verify menu dropdown exists
      const menuDropdown = document.querySelector('.w-50.absolute.left-6.top-20.z-\\[100\\].rounded-md.bg-secondary-950.p-4.text-white.shadow-lg');
      expect(menuDropdown).toBeInTheDocument();
      
      // Verify navigation links exist
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
    });
  });
}); 