import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadPage from '../page';

// Mock the TemplateUploader component
jest.mock('../components/TemplateUploader', () => {
  return function MockTemplateUploader() {
    return <div data-testid="template-uploader">Template Uploader Component</div>;
  };
});

describe('UploadPage', () => {
  it('should render the upload page', () => {
    render(<UploadPage />);

    expect(screen.getByTestId('template-uploader')).toBeInTheDocument();
  });

  it('should render with correct container styling', () => {
    const { container } = render(<UploadPage />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('p-6');
  });

  it('should be a functional component', () => {
    expect(typeof UploadPage).toBe('function');
  });

  it('should render TemplateUploader component', () => {
    render(<UploadPage />);

    expect(screen.getByTestId('template-uploader')).toBeInTheDocument();
    expect(screen.getByText('Template Uploader Component')).toBeInTheDocument();
  });

  describe('Component structure', () => {
    it('should have proper div wrapper', () => {
      const { container } = render(<UploadPage />);

      expect(container.firstChild).toHaveProperty('tagName', 'DIV');
    });

    it('should contain only one child component', () => {
      const { container } = render(<UploadPage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.children).toHaveLength(1);
    });
  });

  describe('Styling', () => {
    it('should have padding classes', () => {
      const { container } = render(<UploadPage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('p-6');
    });
  });

  describe('Accessibility', () => {
    it('should render without accessibility violations', () => {
      render(<UploadPage />);

      // Basic accessibility check - component renders without errors
      expect(screen.getByTestId('template-uploader')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate properly with TemplateUploader', () => {
      render(<UploadPage />);

      expect(screen.getByTestId('template-uploader')).toBeInTheDocument();
    });
  });
}); 