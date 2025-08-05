import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadResultsPage from '../page';

const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

jest.mock('@/app/results/components/LayoutHeader', () => {
  return function MockLayoutHeader({ projectId, onBack }: any) {
    return (
      <div data-testid="layout-header" data-project-id={projectId}>
        <button onClick={onBack} data-testid="back-button">Back</button>
      </div>
    );
  };
});

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: any) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color}>Icon: {name}</div>
  ),
  IconName: { ArrowLeft: 'ArrowLeft' },
}));

jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, disabled, className, pill, textColor, variant, size, ...props }: any) => (
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
  ButtonVariant: { OUTLINE: 'outline' },
}));

jest.mock('../components/zipFileUploader', () => ({
  ZipFileUploader: ({ className }: any) => (
    <div data-testid="zip-file-uploader" className={className}>ZipFileUploader</div>
  ),
}));

describe('UploadResultsPage (Zipfile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('renders the header, title, and ZipFileUploader', () => {
    render(<UploadResultsPage />);
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
    expect(screen.getByText('Upload Test Result Zip File')).toBeInTheDocument();
    expect(screen.getByTestId('zip-file-uploader')).toBeInTheDocument();
  });

  it('shows navigation buttons and disables Upload Zip File button', () => {
    render(<UploadResultsPage />);
    expect(screen.getByTestId('button-upload-zip-file')).toBeDisabled();
    expect(screen.getByTestId('button-results-editor')).toBeInTheDocument();
  });

  it('shows the correct instructions and links', () => {
    render(<UploadResultsPage />);
    expect(screen.getByText(/If you have a zip file containing both your results.json/)).toBeInTheDocument();
    expect(screen.getByText(/If you want to manually enter test results and artifacts/)).toBeInTheDocument();
    expect(screen.getAllByText('Results Editor').length).toBeGreaterThan(0);
  });

  it('renders the back arrow link when not in project flow', () => {
    render(<UploadResultsPage />);
    expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
  });

  it('does not render the back arrow link in project flow', () => {
    mockGet.mockImplementation((key: string) => (key === 'projectId' ? 'proj123' : null));
    render(<UploadResultsPage />);
    expect(screen.queryByTestId('icon-ArrowLeft')).not.toBeInTheDocument();
  });

  it('navigates to the correct Results Editor link in project flow', () => {
    mockGet.mockImplementation((key: string) => (key === 'projectId' ? 'proj123' : null));
    render(<UploadResultsPage />);
    const resultsEditorLinks = screen.getAllByText('Results Editor');
    resultsEditorLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('projectId=proj123'));
    });
  });

  it('calls router.push to go back to project page when back button is clicked in project flow', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'projectId') return 'proj123';
      if (key === 'flow') return 'flow456';
      return null;
    });
    render(<UploadResultsPage />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockPush).toHaveBeenCalledWith('/project/select_data?flow=flow456&projectId=proj123');
  });
}); 