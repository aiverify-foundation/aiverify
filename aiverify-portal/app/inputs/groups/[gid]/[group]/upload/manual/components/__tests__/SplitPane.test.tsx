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
            <h1>Upload Form</h1>
            <form>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </div>
        }
        rightPane={
          <div>
            <h2>Preview</h2>
            <p>Form preview content</p>
          </div>
        }
      />
    );

    expect(container).toHaveTextContent('Upload Form');
    expect(container).toHaveTextContent('Submit');
    expect(container).toHaveTextContent('Preview');
    expect(container).toHaveTextContent('Form preview content');
  });

  it('has correct CSS classes', () => {
    const { container } = render(
      <SplitPane
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />
    );

    const mainDiv = container.firstChild as HTMLElement;
    const leftDiv = container.querySelector('.basis-1\\/4');
    const rightDiv = container.querySelector('.basis-3\\/4');

    expect(mainDiv).toHaveClass('flex', 'w-full', 'h-full');
    expect(leftDiv).toHaveClass('basis-1/4', 'p-2');
    expect(rightDiv).toHaveClass('basis-3/4', 'overflow-y-auto', 'p-3');
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