import { render } from '@testing-library/react';
import SelectDataLayout from '../layout';

describe('SelectDataLayout', () => {
  it('renders layout with children', () => {
    const { container } = render(
      <SelectDataLayout>
        <div data-testid="test-children">Test Content</div>
      </SelectDataLayout>
    );

    const children = container.querySelector('[data-testid="test-children"]');
    const main = container.querySelector('main');

    expect(children).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders layout with multiple children', () => {
    const { container } = render(
      <SelectDataLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </SelectDataLayout>
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
      <SelectDataLayout>
        <div>Test Content</div>
      </SelectDataLayout>
    );

    const layoutDiv = container.firstChild as HTMLElement;
    const main = container.querySelector('main');

    expect(layoutDiv).toHaveClass('min-h-screen');
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

  it('renders empty children gracefully', () => {
    const { container } = render(
      <SelectDataLayout>
        {null}
      </SelectDataLayout>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
}); 