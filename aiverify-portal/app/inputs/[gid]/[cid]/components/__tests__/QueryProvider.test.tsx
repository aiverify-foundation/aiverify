import React from 'react';
import ReactDOM from 'react-dom';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryProvider } from '../QueryProvider';

describe('QueryProvider', () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(<QueryProvider>{mockChildren}</QueryProvider>);
    
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with different types of children', () => {
    const textChildren = 'Text content';
    render(<QueryProvider>{textChildren}</QueryProvider>);
    
    expect(screen.getByText('Text content')).toBeInTheDocument();
  });

  it('renders with multiple children', () => {
    const multipleChildren = (
      <>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </>
    );
    
    render(<QueryProvider>{multipleChildren}</QueryProvider>);
    
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('renders without crashing when children is null', () => {
    expect(() => {
      render(<QueryProvider>{null}</QueryProvider>);
    }).not.toThrow();
  });

  it('renders without crashing when children is undefined', () => {
    expect(() => {
      render(<QueryProvider>{undefined}</QueryProvider>);
    }).not.toThrow();
  });

  it('renders without crashing when children is empty', () => {
    expect(() => {
      render(<QueryProvider children={null} />);
    }).not.toThrow();
  });

  it('maintains proper component structure', () => {
    render(<QueryProvider>{mockChildren}</QueryProvider>);
    
    const children = screen.getByTestId('mock-children');
    expect(children).toBeInTheDocument();
    expect(children.parentElement).toBeInTheDocument();
  });

  it('handles complex nested children', () => {
    const complexChildren = (
      <div data-testid="complex-container">
        <header>
          <h1>Header</h1>
        </header>
        <main>
          <section>
            <p>Content</p>
          </section>
        </main>
        <footer>
          <span>Footer</span>
        </footer>
      </div>
    );
    
    render(<QueryProvider>{complexChildren}</QueryProvider>);
    
    expect(screen.getByTestId('complex-container')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('handles children with event handlers', () => {
    const mockClickHandler = jest.fn();
    const childrenWithHandlers = (
      <button data-testid="test-button" onClick={mockClickHandler}>
        Click me
      </button>
    );
    
    render(<QueryProvider>{childrenWithHandlers}</QueryProvider>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles children with CSS classes', () => {
    const childrenWithClasses = (
      <div data-testid="styled-child" className="test-class">
        Styled content
      </div>
    );
    
    render(<QueryProvider>{childrenWithClasses}</QueryProvider>);
    
    const styledChild = screen.getByTestId('styled-child');
    expect(styledChild).toBeInTheDocument();
    expect(styledChild).toHaveClass('test-class');
    expect(screen.getByText('Styled content')).toBeInTheDocument();
  });

  it('handles children with inline styles', () => {
    const childrenWithStyles = (
      <div data-testid="styled-child" style={{ color: 'red', fontSize: '16px' }}>
        Styled content
      </div>
    );
    
    render(<QueryProvider>{childrenWithStyles}</QueryProvider>);
    
    const styledChild = screen.getByTestId('styled-child');
    expect(styledChild).toBeInTheDocument();
    expect(styledChild).toHaveStyle('color: rgb(255, 0, 0)');
    expect(styledChild).toHaveStyle('font-size: 16px');
  });

  it('handles children with data attributes', () => {
    const childrenWithData = (
      <div data-testid="data-child" data-custom="value" data-another="test">
        Data content
      </div>
    );
    
    render(<QueryProvider>{childrenWithData}</QueryProvider>);
    
    const dataChild = screen.getByTestId('data-child');
    expect(dataChild).toBeInTheDocument();
    expect(dataChild).toHaveAttribute('data-custom', 'value');
    expect(dataChild).toHaveAttribute('data-another', 'test');
  });

  it('handles children with refs', () => {
    const TestComponent = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      return (
        <div data-testid="ref-child" ref={ref}>
          Ref content
        </div>
      );
    };
    
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('ref-child')).toBeInTheDocument();
    expect(screen.getByText('Ref content')).toBeInTheDocument();
  });

  it('handles children with context consumers', () => {
    const TestContext = React.createContext<string>('default');
    const TestConsumer = () => {
      const value = React.useContext(TestContext);
      return <div data-testid="context-child">{value}</div>;
    };
    
    render(
      <QueryProvider>
        <TestConsumer />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('context-child')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  it('handles children with hooks', () => {
    const TestComponentWithHook = () => {
      const [count, setCount] = React.useState(0);
      return (
        <div data-testid="hook-child">
          <span>Count: {count}</span>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      );
    };
    
    render(
      <QueryProvider>
        <TestComponentWithHook />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('hook-child')).toBeInTheDocument();
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('handles children with async operations', () => {
    const TestAsyncComponent = () => {
      const [data, setData] = React.useState<string>('Loading...');
      
      React.useEffect(() => {
        setTimeout(() => setData('Loaded'), 0);
      }, []);
      
      return <div data-testid="async-child">{data}</div>;
    };
    
    render(
      <QueryProvider>
        <TestAsyncComponent />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('async-child')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles children with error boundaries', () => {
    const TestErrorComponent = () => {
      throw new Error('Test error');
    };
    
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(
        <QueryProvider>
          <TestErrorComponent />
        </QueryProvider>
      );
    }).toThrow('Test error');
    
    consoleSpy.mockRestore();
  });

  it('handles children with portals', () => {
    const TestPortalComponent = () => {
      return ReactDOM.createPortal(
        <div data-testid="portal-child">Portal content</div>,
        document.body
      );
    };
    
    render(
      <QueryProvider>
        <TestPortalComponent />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('portal-child')).toBeInTheDocument();
    expect(screen.getByText('Portal content')).toBeInTheDocument();
  });

  it('handles children with fragments', () => {
    const TestFragmentComponent = () => (
      <>
        <div data-testid="fragment-child-1">Fragment 1</div>
        <div data-testid="fragment-child-2">Fragment 2</div>
      </>
    );
    
    render(
      <QueryProvider>
        <TestFragmentComponent />
      </QueryProvider>
    );
    
    expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
    expect(screen.getByText('Fragment 1')).toBeInTheDocument();
    expect(screen.getByText('Fragment 2')).toBeInTheDocument();
  });
}); 