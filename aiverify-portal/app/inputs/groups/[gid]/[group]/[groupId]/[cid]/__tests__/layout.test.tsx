import { render } from '@testing-library/react';
import ChecklistLayout from '../layout';

describe('ChecklistLayout', () => {
  it('renders children directly', () => {
    const { container } = render(
      <ChecklistLayout>
        <div data-testid="test-children">Test Content</div>
      </ChecklistLayout>
    );

    const children = container.querySelector('[data-testid="test-children"]');
    expect(children).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders multiple children', () => {
    const { container } = render(
      <ChecklistLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </ChecklistLayout>
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
      <ChecklistLayout>
        <div>
          <h1>Checklist Title</h1>
          <p>Checklist description</p>
          <button>Action</button>
        </div>
      </ChecklistLayout>
    );

    expect(container).toHaveTextContent('Checklist Title');
    expect(container).toHaveTextContent('Checklist description');
    expect(container).toHaveTextContent('Action');
  });

  it('renders empty children gracefully', () => {
    const { container } = render(
      <ChecklistLayout>
        {null}
      </ChecklistLayout>
    );

    expect(container.firstChild).toBeNull();
  });

  it('has correct metadata', () => {
    const metadata = require('../layout').metadata;
    expect(metadata.title).toBe('Checklist Details');
    expect(metadata.description).toBe('View and edit checklist details');
  });
}); 