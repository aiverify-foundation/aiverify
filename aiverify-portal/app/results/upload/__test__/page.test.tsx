import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadPage from '../page';

// Mock next/navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

// Mock LayoutHeader
jest.mock('@/app/results/components/LayoutHeader', () => {
  return function MockLayoutHeader({ projectId, onBack }: any) {
    return (
      <div data-testid="layout-header" data-project-id={projectId}>
        <button onClick={onBack} data-testid="back-button">Back</button>
      </div>
    );
  };
});

// Mock Icon
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: any) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color}>Icon: {name}</div>
  ),
  IconName: { Folder: 'Folder' },
}));

// Mock Button
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, disabled, className, ...props }: any) => (
    <button
      data-testid={`button-${text?.replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {text}
    </button>
  ),
  ButtonVariant: { PRIMARY: 'primary' },
}));

describe('UploadPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('renders the upload method cards and header', () => {
    render(<UploadPage />);
    expect(screen.getByText('Upload Test Results')).toBeInTheDocument();
    expect(screen.getByText('How would you like to upload your test results?')).toBeInTheDocument();
    expect(screen.getByText('Upload Zip File')).toBeInTheDocument();
    expect(screen.getByText('Manual Upload')).toBeInTheDocument();
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });

  it('shows descriptions for both upload methods', () => {
    render(<UploadPage />);
    expect(screen.getByText((content, node) => node?.textContent === 'Supported format' && node.nextSibling?.textContent === 'ZIP')).toBeInTheDocument();
    expect(screen.getByText((content, node) => node?.textContent === 'Supported formats' && node.nextSibling?.textContent === 'JSON')).toBeInTheDocument();
    expect(screen.getByText((content, node) => node?.textContent === 'Supported test types' && node.nextSibling?.textContent === 'All test types')).toBeInTheDocument();
    expect(screen.getByText((content, node) => node?.textContent === 'How it works' && node.nextSibling?.textContent === 'AI Verify will import the test results from the ZIP file.')).toBeInTheDocument();
    expect(screen.getByText((content, node) => node?.textContent === 'How it works' && node.nextSibling?.textContent === 'AI Verify will process the uploaded files as test results.')).toBeInTheDocument();
  });

  it('disables the NEXT button until a card is selected', () => {
    render(<UploadPage />);
    const nextButton = screen.getByTestId('button-next');
    expect(nextButton).toBeDisabled();
  });

  it('enables the NEXT button after selecting a card', () => {
    render(<UploadPage />);
    fireEvent.click(screen.getByText('Upload Zip File'));
    const nextButton = screen.getByTestId('button-next');
    expect(nextButton).not.toBeDisabled();
  });

  it('highlights the selected card and shows the correct icon color', () => {
    render(<UploadPage />);
    fireEvent.click(screen.getByText('Manual Upload'));
    // The icon for the selected card should have the selected color
    const icons = screen.getAllByTestId('icon-Folder');
    expect(icons.some(icon => icon.getAttribute('data-color') === '#C084FC')).toBe(true);
  });

  it('navigates to the correct page when NEXT is clicked (manual)', () => {
    render(<UploadPage />);
    fireEvent.click(screen.getByText('Manual Upload'));
    fireEvent.click(screen.getByTestId('button-next'));
    expect(mockPush).toHaveBeenCalledWith('/results/upload/manual');
  });

  it('navigates to the correct page when NEXT is clicked (zipfile)', () => {
    render(<UploadPage />);
    fireEvent.click(screen.getByText('Upload Zip File'));
    fireEvent.click(screen.getByTestId('button-next'));
    expect(mockPush).toHaveBeenCalledWith('/results/upload/zipfile');
  });

  it('handles project flow context and passes projectId to header', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'projectId') return 'proj123';
      if (key === 'flow') return 'flow456';
      return null;
    });
    render(<UploadPage />);
    expect(screen.getByTestId('layout-header')).toHaveAttribute('data-project-id', 'proj123');
  });

  it('navigates to the correct project flow URL on NEXT', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'projectId') return 'proj123';
      if (key === 'flow') return 'flow456';
      return null;
    });
    render(<UploadPage />);
    fireEvent.click(screen.getByText('Manual Upload'));
    fireEvent.click(screen.getByTestId('button-next'));
    expect(mockPush).toHaveBeenCalledWith('/results/upload/manual?flow=flow456&projectId=proj123');
  });

  it('calls router.push to go back to project page when back button is clicked in project flow', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'projectId') return 'proj123';
      if (key === 'flow') return 'flow456';
      return null;
    });
    render(<UploadPage />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockPush).toHaveBeenCalledWith('/project/select_data?flow=flow456&projectId=proj123');
  });

  it('calls window.history.back when back button is clicked outside project flow', () => {
    const originalBack = window.history.back;
    window.history.back = jest.fn();
    render(<UploadPage />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(window.history.back).toHaveBeenCalled();
    window.history.back = originalBack;
  });
}); 