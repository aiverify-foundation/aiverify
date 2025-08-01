import { render, screen } from '@testing-library/react';
import { Providers } from '../providers';

describe('Providers', () => {
  it('renders QueryClientProvider with children', () => {
    render(
      <Providers>
        <div data-testid="test-children">Test Content</div>
      </Providers>
    );

    const children = screen.getByTestId('test-children');
    expect(children).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders multiple children', () => {
    render(
      <Providers>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </Providers>
    );

    const child1 = screen.getByTestId('child1');
    const child2 = screen.getByTestId('child2');

    expect(child1).toBeInTheDocument();
    expect(child1).toHaveTextContent('Child 1');
    expect(child2).toBeInTheDocument();
    expect(child2).toHaveTextContent('Child 2');
  });

  it('renders without children', () => {
    render(<Providers>{null}</Providers>);
    
    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });
}); 