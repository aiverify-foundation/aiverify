import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryProvider } from '../QueryProvider';

describe('QueryProvider', () => {
  it('renders without crashing', () => {
    const testChildren = <div data-testid="test-children">Test Content</div>;
    
    render(<QueryProvider>{testChildren}</QueryProvider>);
    
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const testChildren = (
      <div>
        <h1>Test Title</h1>
        <p>Test paragraph</p>
        <button>Test Button</button>
      </div>
    );
    
    render(<QueryProvider>{testChildren}</QueryProvider>);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles multiple children elements', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );
    
    render(<QueryProvider>{multipleChildren}</QueryProvider>);
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('handles empty children without crashing', () => {
    render(<QueryProvider>{null}</QueryProvider>);
    
    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('handles undefined children without crashing', () => {
    render(<QueryProvider>{undefined}</QueryProvider>);
    
    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('handles string children', () => {
    const stringChildren = 'Simple text content';
    
    render(<QueryProvider>{stringChildren}</QueryProvider>);
    
    expect(screen.getByText(stringChildren)).toBeInTheDocument();
  });

  it('handles number children', () => {
    const numberChildren = 42;
    
    render(<QueryProvider>{numberChildren}</QueryProvider>);
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles complex nested children', () => {
    const complexChildren = (
      <div>
        <header>
          <h1>Complex Header</h1>
        </header>
        <main>
          <section>
            <h2>Section Title</h2>
            <p>Section content with <strong>bold text</strong> and <em>italic text</em>.</p>
          </section>
        </main>
        <footer>
          <p>Footer content</p>
        </footer>
      </div>
    );
    
    render(<QueryProvider>{complexChildren}</QueryProvider>);
    
    expect(screen.getByText('Complex Header')).toBeInTheDocument();
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText(/Section content with/)).toBeInTheDocument();
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('handles functional components as children', () => {
    const TestComponent = () => <div data-testid="functional-component">Functional Component</div>;
    
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('functional-component')).toBeInTheDocument();
    expect(screen.getByText('Functional Component')).toBeInTheDocument();
  });

  it('handles array of children', () => {
    const arrayChildren = [
      <div key="1" data-testid="array-child-1">Array Child 1</div>,
      <div key="2" data-testid="array-child-2">Array Child 2</div>,
      <div key="3" data-testid="array-child-3">Array Child 3</div>,
    ];
    
    render(<QueryProvider>{arrayChildren}</QueryProvider>);
    
    expect(screen.getByTestId('array-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('array-child-2')).toBeInTheDocument();
    expect(screen.getByTestId('array-child-3')).toBeInTheDocument();
  });

  it('maintains proper component structure', () => {
    const testChildren = <div data-testid="test-children">Test Content</div>;
    
    const { container } = render(<QueryProvider>{testChildren}</QueryProvider>);
    
    // Should have a single root element
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles React fragments as children', () => {
    const fragmentChildren = (
      <React.Fragment>
        <div data-testid="fragment-child-1">Fragment Child 1</div>
        <div data-testid="fragment-child-2">Fragment Child 2</div>
      </React.Fragment>
    );
    
    render(<QueryProvider>{fragmentChildren}</QueryProvider>);
    
    expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
  });

  it('handles conditional rendering in children', () => {
    const ConditionalComponent = ({ show }: { show: boolean }) => (
      <div>
        {show && <div data-testid="conditional-content">Conditional Content</div>}
        <div data-testid="always-present">Always Present</div>
      </div>
    );
    
    render(
      <QueryProvider>
        <ConditionalComponent show={true} />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
    expect(screen.getByTestId('always-present')).toBeInTheDocument();
  });

  it('handles event handlers in children', () => {
    const handleClick = jest.fn();
    const testChildren = (
      <button data-testid="test-button" onClick={handleClick}>
        Click Me
      </button>
    );
    
    render(<QueryProvider>{testChildren}</QueryProvider>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(() => button.click()).not.toThrow();
  });

  it('handles form elements in children', () => {
    const formChildren = (
      <form data-testid="test-form">
        <input type="text" data-testid="test-input" placeholder="Enter text" />
        <button type="submit" data-testid="submit-button">Submit</button>
      </form>
    );
    
    render(<QueryProvider>{formChildren}</QueryProvider>);
    
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('handles accessibility attributes in children', () => {
    const accessibleChildren = (
      <div>
        <button aria-label="Accessible button" data-testid="accessible-button">
          Button
        </button>
        <input aria-describedby="description" data-testid="accessible-input" />
        <div id="description" data-testid="description">Description text</div>
      </div>
    );
    
    render(<QueryProvider>{accessibleChildren}</QueryProvider>);
    
    expect(screen.getByTestId('accessible-button')).toHaveAttribute('aria-label', 'Accessible button');
    expect(screen.getByTestId('accessible-input')).toHaveAttribute('aria-describedby', 'description');
    expect(screen.getByTestId('description')).toBeInTheDocument();
  });

  it('handles CSS classes in children', () => {
    const styledChildren = (
      <div>
        <div className="test-class" data-testid="styled-element">Styled Element</div>
        <button className="btn btn-primary" data-testid="styled-button">Styled Button</button>
      </div>
    );
    
    render(<QueryProvider>{styledChildren}</QueryProvider>);
    
    const styledElement = screen.getByTestId('styled-element');
    const styledButton = screen.getByTestId('styled-button');
    
    expect(styledElement).toHaveClass('test-class');
    expect(styledButton).toHaveClass('btn', 'btn-primary');
  });

  it('handles data attributes in children', () => {
    const dataChildren = (
      <div>
        <div data-testid="data-element" data-custom="value" data-another="test">
          Data Element
        </div>
      </div>
    );
    
    render(<QueryProvider>{dataChildren}</QueryProvider>);
    
    const dataElement = screen.getByTestId('data-element');
    expect(dataElement).toHaveAttribute('data-custom', 'value');
    expect(dataElement).toHaveAttribute('data-another', 'test');
  });
}); 