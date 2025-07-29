import { render, screen } from '@testing-library/react';
import { HeaderWithLogo } from '../headerWithLogo';

describe('HeaderWithLogo', () => {
  it('renders header with logo and children', () => {
    render(
      <HeaderWithLogo className="test-header">
        <div data-testid="test-children">Test Content</div>
      </HeaderWithLogo>
    );

    const header = screen.getByRole('banner');
    const logo = screen.getByAltText('AI Verify');
    const children = screen.getByTestId('test-children');

    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('test-header');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/aiverify-logo-white.svg');
    expect(logo).toHaveAttribute('width', '250');
    expect(logo).toHaveAttribute('height', '40');
    expect(children).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Content');
  });

  it('renders header without className', () => {
    render(
      <HeaderWithLogo>
        <div data-testid="test-children">Test Content</div>
      </HeaderWithLogo>
    );

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).not.toHaveClass('test-header');
  });

  it('renders header without children', () => {
    render(<HeaderWithLogo className="test-header" />);

    const header = screen.getByRole('banner');
    const logo = screen.getByAltText('AI Verify');

    expect(header).toBeInTheDocument();
    expect(logo).toBeInTheDocument();
  });
}); 