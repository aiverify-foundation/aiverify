import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadPage from '../page';

// Mock the PluginUploader component
jest.mock('../components/PluginUploader', () => {
  return function MockPluginUploader() {
    return <div data-testid="plugin-uploader">Mock Plugin Uploader</div>;
  };
});

describe('UploadPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<UploadPage />);
      expect(screen.getByTestId('plugin-uploader')).toBeInTheDocument();
    });

    it('renders the main container with correct CSS classes', () => {
      const { container } = render(<UploadPage />);
      
      const mainContainer = container.querySelector('.p-6');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('p-6');
    });

    it('renders the PluginUploader component', () => {
      render(<UploadPage />);
      
      const pluginUploader = screen.getByTestId('plugin-uploader');
      expect(pluginUploader).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has proper DOM hierarchy', () => {
      const { container } = render(<UploadPage />);
      
      const mainContainer = container.querySelector('.p-6');
      const pluginUploader = screen.getByTestId('plugin-uploader');
      
      expect(mainContainer).toContainElement(pluginUploader);
    });

    it('applies correct styling to the container', () => {
      const { container } = render(<UploadPage />);
      
      const mainContainer = container.querySelector('.p-6');
      expect(mainContainer).toHaveClass('p-6');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<UploadPage />);
      
      const mainContainer = container.querySelector('.p-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('contains the plugin uploader component', () => {
      render(<UploadPage />);
      
      const pluginUploader = screen.getByTestId('plugin-uploader');
      expect(pluginUploader).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with PluginUploader', () => {
      render(<UploadPage />);
      
      const pluginUploader = screen.getByTestId('plugin-uploader');
      expect(pluginUploader).toHaveTextContent('Mock Plugin Uploader');
    });
  });
}); 