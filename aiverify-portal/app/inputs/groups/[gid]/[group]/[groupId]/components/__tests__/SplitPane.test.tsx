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
            <h1>Title</h1>
            <p>Description</p>
          </div>
        }
        rightPane={
          <div>
            <button>Action</button>
            <span>Info</span>
          </div>
        }
      />
    );

    expect(container).toHaveTextContent('Title');
    expect(container).toHaveTextContent('Description');
    expect(container).toHaveTextContent('Action');
    expect(container).toHaveTextContent('Info');
  });

  it('has correct CSS classes', () => {
    const { container } = render(
      <SplitPane
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />
    );

    const mainDiv = container.firstChild as HTMLElement;
    const leftDiv = container.querySelector('.flex-1.basis-1\\/4');
    const rightDiv = container.querySelector('.flex-1.basis-3\\/4');

    expect(mainDiv).toHaveClass('flex', 'h-full', 'w-full', 'flex-1');
    expect(leftDiv).toHaveClass('flex-1', 'basis-1/4', 'p-4');
    expect(rightDiv).toHaveClass('flex-1', 'basis-3/4', 'overflow-y-auto', 'p-3');
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