import { render } from '@testing-library/react';
import SplitPane from '../SplitPane';

describe('SplitPane', () => {
  it('renders split pane with left and right content', () => {
    const { container } = render(
      <SplitPane
        leftPane={<div data-testid="left-pane">Left Content</div>}
        rightPane={<div data-testid="right-pane">Right Content</div>}
      />
    );

    const leftPane = container.querySelector('[data-testid="left-pane"]');
    const rightPane = container.querySelector('[data-testid="right-pane"]');

    expect(leftPane).toBeInTheDocument();
    expect(rightPane).toBeInTheDocument();
    expect(leftPane).toHaveTextContent('Left Content');
    expect(rightPane).toHaveTextContent('Right Content');
  });

  it('renders split pane with complex content', () => {
    const { container } = render(
      <SplitPane
        leftPane={
          <div>
            <h1>Model List</h1>
            <ul>
              <li>Model 1</li>
              <li>Model 2</li>
            </ul>
          </div>
        }
        rightPane={
          <div>
            <h2>Model Details</h2>
            <p>Model information</p>
          </div>
        }
      />
    );

    expect(container).toHaveTextContent('Model List');
    expect(container).toHaveTextContent('Model 1');
    expect(container).toHaveTextContent('Model 2');
    expect(container).toHaveTextContent('Model Details');
    expect(container).toHaveTextContent('Model information');
  });

  it('has correct CSS classes', () => {
    const { container } = render(
      <SplitPane
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />
    );

    const mainDiv = container.firstChild as HTMLElement;
    const leftDiv = container.querySelector('.flex-shrink-0.flex-grow.basis-3\\/5');
    const rightDiv = container.querySelector('.basis-2\\/5');

    expect(mainDiv).toHaveClass('flex', 'h-[calc(100vh-150px)]');
    expect(leftDiv).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-3/5', 'p-2');
    expect(rightDiv).toHaveClass('basis-2/5', 'overflow-y-auto', 'p-2');
  });

  it('renders empty content gracefully', () => {
    const { container } = render(
      <SplitPane
        leftPane={null}
        rightPane={undefined}
      />
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv.children).toHaveLength(2);
  });
}); 