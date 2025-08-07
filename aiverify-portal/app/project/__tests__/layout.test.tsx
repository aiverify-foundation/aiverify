import { render } from '@testing-library/react';
import ProjectsLayout from '../layout';

// Mock the ProjectsHeader component
jest.mock('../components/ProjectsHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="projects-header">Projects Header</div>,
}));

describe('ProjectsLayout', () => {
  it('renders layout with children', () => {
    const { container } = render(
      <ProjectsLayout>
        <div data-testid="test-children">Test Content</div>
      </ProjectsLayout>
    );

    const header = container.querySelector('[data-testid="projects-header"]');
    const children = container.querySelector('[data-testid="test-children"]');
    const main = container.querySelector('main');

    expect(header).toBeInTheDocument();
    expect(children).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders layout with multiple children', () => {
    const { container } = render(
      <ProjectsLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </ProjectsLayout>
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
      <ProjectsLayout>
        <div>Test Content</div>
      </ProjectsLayout>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass(
      'mx-auto',
      'px-4',
      'pt-[64px]',
      'sm:px-6',
      'lg:max-w-[2400px]',
      'lg:px-8',
      'xl:max-w-[2600px]',
      'xl:px-12'
    );
  });

  it('renders empty children gracefully', () => {
    const { container } = render(
      <ProjectsLayout>
        {null}
      </ProjectsLayout>
    );

    const header = container.querySelector('[data-testid="projects-header"]');
    const main = container.querySelector('main');

    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });
}); 