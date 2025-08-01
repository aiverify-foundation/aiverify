import React from 'react';
import { render, screen } from '@testing-library/react';
import DatasetsLayout from '../layout';

describe('DatasetsLayout', () => {
  const mockChildren = (
    <div data-testid="test-children">
      <h1>Test Content</h1>
      <p>This is test content for the layout</p>
    </div>
  );

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      expect(screen.getByTestId('test-children')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('This is test content for the layout')).toBeInTheDocument();
    });

    it('renders DatasetsHeader component', () => {
      render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      // The header should be present in the DOM
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('renders main container with correct structure', () => {
      render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      const multipleChildren = (
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </>
      );

      render(<DatasetsLayout>{multipleChildren}</DatasetsLayout>);
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders with null children', () => {
      render(<DatasetsLayout>{null}</DatasetsLayout>);
      
      // Should still render the layout structure
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      render(<DatasetsLayout>{undefined}</DatasetsLayout>);
      
      // Should still render the layout structure
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct root container structure', () => {
      const { container } = render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.tagName).toBe('DIV');
    });

    it('has correct main container styling', () => {
      const { container } = render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const main = container.querySelector('main');
      expect(main).toHaveClass(
        'mx-auto',
        'px-4',
        'pt-[64px]',
        'sm:px-6',
        'lg:max-w-[1520px]',
        'lg:px-8',
        'xl:max-w-[1720px]',
        'xl:px-12'
      );
    });

    it('renders DatasetsHeader before main content', () => {
      const { container } = render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const rootDiv = container.firstChild as HTMLElement;
      const header = rootDiv.firstChild as HTMLElement;
      const main = rootDiv.lastChild as HTMLElement;
      
      expect(header?.tagName).toBe('HEADER');
      expect(main?.tagName).toBe('MAIN');
    });
  });

  describe('Props Handling', () => {
    it('accepts ReactNode children', () => {
      const stringChildren = 'String children';
      const numberChildren = 42;
      const arrayChildren = [<div key="1">Array child 1</div>, <div key="2">Array child 2</div>];

      // Test string children
      render(<DatasetsLayout>{stringChildren}</DatasetsLayout>);
      expect(screen.getByText('String children')).toBeInTheDocument();

      // Test number children
      render(<DatasetsLayout>{numberChildren}</DatasetsLayout>);
      expect(screen.getByText('42')).toBeInTheDocument();

      // Test array children
      render(<DatasetsLayout>{arrayChildren}</DatasetsLayout>);
      expect(screen.getByText('Array child 1')).toBeInTheDocument();
      expect(screen.getByText('Array child 2')).toBeInTheDocument();
    });

    it('handles empty children', () => {
      render(<DatasetsLayout>{null}</DatasetsLayout>);
      
      // Should still render the layout structure
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains accessibility when children are complex components', () => {
      const complexChildren = (
        <div>
          <header>
            <h1>Complex Header</h1>
          </header>
          <section>
            <h2>Complex Section</h2>
            <p>Complex content</p>
          </section>
        </div>
      );
      
      render(<DatasetsLayout>{complexChildren}</DatasetsLayout>);
      
      expect(screen.getAllByRole('banner')).toHaveLength(2); // Layout header + children header
      expect(screen.getByRole('main')).toBeInTheDocument();
      // The section element doesn't automatically have the region role
      expect(screen.getByText('Complex Section')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('has correct responsive styling classes', () => {
      const { container } = render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const main = container.querySelector('main');
      expect(main).toHaveClass('sm:px-6', 'lg:px-8', 'xl:px-12');
    });

    it('has correct max-width constraints', () => {
      const { container } = render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const main = container.querySelector('main');
      expect(main).toHaveClass('lg:max-w-[1520px]', 'xl:max-w-[1720px]');
    });

    it('has correct padding and margin', () => {
      const { container } = render(<DatasetsLayout>{mockChildren}</DatasetsLayout>);
      
      const main = container.querySelector('main');
      expect(main).toHaveClass('mx-auto', 'px-4', 'pt-[64px]');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large children content', () => {
      const largeContent = (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i}>Large content item {i}</div>
          ))}
        </div>
      );

      render(<DatasetsLayout>{largeContent}</DatasetsLayout>);
      
      // Should render without issues
      expect(screen.getByText('Large content item 0')).toBeInTheDocument();
      expect(screen.getByText('Large content item 999')).toBeInTheDocument();
    });

    it('handles children with event handlers', () => {
      const mockClickHandler = jest.fn();
      const childrenWithHandlers = (
        <button onClick={mockClickHandler} data-testid="test-button">
          Click me
        </button>
      );

      render(<DatasetsLayout>{childrenWithHandlers}</DatasetsLayout>);
      
      const button = screen.getByTestId('test-button');
      expect(button).toBeInTheDocument();
      
      // Event handlers should still work
      button.click();
      expect(mockClickHandler).toHaveBeenCalledTimes(1);
    });

    it('handles children with refs', () => {
      const TestComponent = React.forwardRef<HTMLDivElement>((props, ref) => (
        <div ref={ref} data-testid="ref-component" {...props}>
          Ref component
        </div>
      ));

      render(
        <DatasetsLayout>
          <TestComponent />
        </DatasetsLayout>
      );
      
      expect(screen.getByTestId('ref-component')).toBeInTheDocument();
    });

    it('handles children with context providers', () => {
      const TestContext = React.createContext('default');
      const childrenWithContext = (
        <TestContext.Provider value="test-value">
          <div data-testid="context-child">Context child</div>
        </TestContext.Provider>
      );

      render(<DatasetsLayout>{childrenWithContext}</DatasetsLayout>);
      
      expect(screen.getByTestId('context-child')).toBeInTheDocument();
    });
  });
}); 