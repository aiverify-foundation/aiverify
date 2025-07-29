import { render } from '@testing-library/react';
import CanvasLayout from '../layout';

// Mock the CanvasHeader component
jest.mock('../components/header', () => ({
  CanvasHeader: () => <div data-testid="canvas-header">Canvas Header</div>,
}));

describe('CanvasLayout', () => {
  it('renders canvas layout with children', () => {
    const { container } = render(
      <CanvasLayout>
        <div data-testid="test-children">Test Content</div>
      </CanvasLayout>
    );

    const header = container.querySelector('[data-testid="canvas-header"]');
    const children = container.querySelector('[data-testid="test-children"]');
    const main = container.querySelector('main');

    expect(header).toBeInTheDocument();
    expect(children).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders canvas layout with multiple children', () => {
    const { container } = render(
      <CanvasLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </CanvasLayout>
    );

    const child1 = container.querySelector('[data-testid="child1"]');
    const child2 = container.querySelector('[data-testid="child2"]');

    expect(child1).toBeInTheDocument();
    expect(child1).toHaveTextContent('Child 1');
    expect(child2).toBeInTheDocument();
    expect(child2).toHaveTextContent('Child 2');
  });

  it('has correct CSS classes', () => {
    const { container } = render(
      <CanvasLayout>
        <div>Test Content</div>
      </CanvasLayout>
    );

    const layoutDiv = container.firstChild as HTMLElement;
    const main = container.querySelector('main');

    expect(layoutDiv).toHaveClass('absolute', 'top-[0]', 'h-[100vh]', 'w-full');
    expect(main).toHaveClass('h-full', 'w-full', 'pt-[64px]');
  });
}); 