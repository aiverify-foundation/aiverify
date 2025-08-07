import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplatesLayout from '../layout';

// Mock the templatesHeader component
jest.mock('../components/templatesHeader', () => {
  return function MockTemplatesHeader() {
    return <div data-testid="templates-header">Templates Header</div>;
  };
});

describe('TemplatesLayout', () => {
  const mockChildren = <div data-testid="child-content">Child Content</div>;

  it('should render the layout with header and children', () => {
    render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

    expect(screen.getByTestId('templates-header')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should render the main element with correct classes', () => {
    render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
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

  it('should render children inside the main element', () => {
    render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('child-content'));
  });

  it('should have proper structure with header before main', () => {
    render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

    const header = screen.getByTestId('templates-header');
    const main = screen.getByRole('main');

    expect(header.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should handle multiple children', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );

    render(<TemplatesLayout>{multipleChildren}</TemplatesLayout>);

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(<TemplatesLayout>{null}</TemplatesLayout>);

    expect(screen.getByTestId('templates-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should handle string children', () => {
    render(<TemplatesLayout>String content</TemplatesLayout>);

    expect(screen.getByRole('main')).toHaveTextContent('String content');
  });

  it('should render the outer div container', () => {
    const { container } = render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

    expect(container.firstChild).toHaveProperty('tagName', 'DIV');
  });

  describe('Accessibility', () => {
    it('should have proper main landmark', () => {
      render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should maintain proper heading hierarchy', () => {
      const contentWithHeading = <h1>Page Title</h1>;
      render(<TemplatesLayout>{contentWithHeading}</TemplatesLayout>);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('should have responsive padding classes', () => {
      render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'xl:px-12');
    });

    it('should have responsive max-width classes', () => {
      render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('lg:max-w-[1520px]', 'xl:max-w-[1720px]');
    });

    it('should have top padding for header spacing', () => {
      render(<TemplatesLayout>{mockChildren}</TemplatesLayout>);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('pt-[64px]');
    });
  });
}); 