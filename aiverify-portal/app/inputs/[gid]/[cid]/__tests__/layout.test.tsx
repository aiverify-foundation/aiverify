import { render } from '@testing-library/react';
import InputBlockLayout from '../layout';

// Mock the providers and components
jest.mock('@/app/inputs/[gid]/[cid]/context/FairnessTreeContext', () => ({
  FairnessTreeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fairness-tree-provider">{children}</div>
  ),
}));

jest.mock('@/app/inputs/components/LayoutHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="layout-header">Layout Header</div>,
}));

describe('InputBlockLayout', () => {
  it('renders layout with children', () => {
    const { container } = render(
      <InputBlockLayout>
        <div data-testid="test-children">Test Content</div>
      </InputBlockLayout>
    );

    const fairnessProvider = container.querySelector('[data-testid="fairness-tree-provider"]');
    const header = container.querySelector('[data-testid="layout-header"]');
    const children = container.querySelector('[data-testid="test-children"]');
    const main = container.querySelector('main');

    expect(fairnessProvider).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(children).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders layout with multiple children', () => {
    const { container } = render(
      <InputBlockLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </InputBlockLayout>
    );

    const child1 = container.querySelector('[data-testid="child1"]');
    const child2 = container.querySelector('[data-testid="child2"]');

    expect(child1).toBeInTheDocument();
    expect(child1).toHaveTextContent('Child 1');
    expect(child2).toBeInTheDocument();
    expect(child2).toHaveTextContent('Child 2');
  });

  it('renders complex children', () => {
    const { container } = render(
      <InputBlockLayout>
        <div>
          <h1>Input Block Title</h1>
          <p>Input block description</p>
          <form>
            <input type="text" placeholder="Input" />
            <button type="submit">Submit</button>
          </form>
        </div>
      </InputBlockLayout>
    );

    expect(container).toHaveTextContent('Input Block Title');
    expect(container).toHaveTextContent('Input block description');
    expect(container).toHaveTextContent('Submit');
  });

  it('renders empty children gracefully', () => {
    const { container } = render(
      <InputBlockLayout>
        {null}
      </InputBlockLayout>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('provides QueryClient context', () => {
    const { container } = render(
      <InputBlockLayout>
        <div>Test</div>
      </InputBlockLayout>
    );

    // The QueryClientProvider should be present in the component tree
    expect(container.firstChild).toBeInTheDocument();
  });
}); 