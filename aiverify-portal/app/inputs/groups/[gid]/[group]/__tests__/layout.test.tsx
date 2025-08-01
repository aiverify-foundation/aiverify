import { render } from '@testing-library/react';
import InputBlockGroupLayout from '../layout';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'projectId') return 'test-project-id';
      if (key === 'flow') return 'test-flow';
      return null;
    }),
  }),
}));

// Mock the providers and components
jest.mock('@/app/inputs/context/InputBlockGroupDataContext', () => ({
  InputBlockGroupDataProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="input-block-group-data-provider">{children}</div>
  ),
}));

jest.mock('../components/LayoutHeader', () => ({
  __esModule: true,
  default: ({ projectId, onBack }: { projectId: string | null; onBack: () => void }) => (
    <div data-testid="layout-header" onClick={onBack}>
      Layout Header - Project: {projectId}
    </div>
  ),
}));

describe('InputBlockGroupLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders layout with children', () => {
    const { container } = render(
      <InputBlockGroupLayout>
        <div data-testid="test-children">Test Content</div>
      </InputBlockGroupLayout>
    );

    const provider = container.querySelector('[data-testid="input-block-group-data-provider"]');
    const header = container.querySelector('[data-testid="layout-header"]');
    const children = container.querySelector('[data-testid="test-children"]');
    const main = container.querySelector('main');

    expect(provider).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(children).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders layout with multiple children', () => {
    const { container } = render(
      <InputBlockGroupLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </InputBlockGroupLayout>
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
      <InputBlockGroupLayout>
        <div>Test Content</div>
      </InputBlockGroupLayout>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass(
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:max-w-[1520px]',
      'lg:px-8',
      'xl:max-w-[1720px]',
      'xl:px-12'
    );
  });

  it('renders empty children gracefully', () => {
    const { container } = render(
      <InputBlockGroupLayout>
        {null}
      </InputBlockGroupLayout>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('passes projectId to header', () => {
    const { container } = render(
      <InputBlockGroupLayout>
        <div>Test</div>
      </InputBlockGroupLayout>
    );

    const header = container.querySelector('[data-testid="layout-header"]');
    expect(header).toHaveTextContent('Layout Header - Project: test-project-id');
  });

  it('handles back navigation when header is clicked', () => {
    const { container } = render(
      <InputBlockGroupLayout>
        <div>Test</div>
      </InputBlockGroupLayout>
    );

    const header = container.querySelector('[data-testid="layout-header"]');
    header?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith('/project/select_data?flow=test-flow&projectId=test-project-id');
  });
}); 