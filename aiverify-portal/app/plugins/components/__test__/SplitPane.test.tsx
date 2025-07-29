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
            <h1>Plugin List</h1>
            <ul>
              <li>Plugin 1</li>
              <li>Plugin 2</li>
            </ul>
          </div>
        }
        rightPane={
          <div>
            <h2>Plugin Details</h2>
            <p>Plugin information</p>
          </div>
        }
      />
    );

    expect(container).toHaveTextContent('Plugin List');
    expect(container).toHaveTextContent('Plugin 1');
    expect(container).toHaveTextContent('Plugin 2');
    expect(container).toHaveTextContent('Plugin Details');
    expect(container).toHaveTextContent('Plugin information');
  });

  it('has correct CSS classes and accessibility attributes', () => {
    const { container } = render(
      <SplitPane
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />
    );

    const mainDiv = container.firstChild as HTMLElement;
    const leftDiv = container.querySelector('.flex-shrink-0.flex-grow.basis-2\\/5');
    const rightDiv = container.querySelector('.flex-shrink-0.flex-grow.basis-3\\/5');

    expect(mainDiv).toHaveClass('flex', 'h-[calc(100vh-150px)]');
    expect(mainDiv).toHaveAttribute('role', 'region');
    expect(mainDiv).toHaveAttribute('aria-label', 'Split pane container');

    expect(leftDiv).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-2/5', 'p-2');
    expect(leftDiv).toHaveAttribute('role', 'region');
    expect(leftDiv).toHaveAttribute('aria-label', 'Left pane content');

    expect(rightDiv).toHaveClass('flex-shrink-0', 'flex-grow', 'basis-3/5', 'overflow-y-auto', 'p-3');
    expect(rightDiv).toHaveAttribute('role', 'region');
    expect(rightDiv).toHaveAttribute('aria-label', 'Right pane content');
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