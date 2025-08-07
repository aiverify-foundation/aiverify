import { render, screen } from '@testing-library/react';
import Loading from '../loading';

// Mock the LoadingAnimation component
jest.mock('@/lib/components/loadingAnimation', () => ({
  LoadingAnimation: () => <div data-testid="loading-animation">Loading...</div>,
}));

describe('Loading', () => {
  it('renders loading animation', () => {
    render(<Loading />);

    const loadingAnimation = screen.getByTestId('loading-animation');
    expect(loadingAnimation).toBeInTheDocument();
    expect(loadingAnimation).toHaveTextContent('Loading...');
  });
}); 