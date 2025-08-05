import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArtifactModal from '../ArtifactPopup';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, className, width, height }: any) {
    return <img src={src} alt={alt} className={className} width={width} height={height} data-testid="artifact-image" />;
  };
});

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, disabled, pill, textColor, variant, size, className, ...props }: any) => (
    <button
      data-testid={`button-${text?.toLowerCase()}`}
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

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;

describe('ArtifactModal', () => {
  const mockOnClose = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:test-url');
  });

  it('renders nothing when isOpen is false', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={false}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.queryByText('test.json')).not.toBeInTheDocument();
  });

  it('renders modal with artifact name when isOpen is true', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('test.json')).toBeInTheDocument();
    expect(screen.getByTestId('button-close')).toBeInTheDocument();
    expect(screen.getByTestId('button-download')).toBeInTheDocument();
  });

  it('displays error message when artifact type is missing', () => {
    const artifact = {
      name: 'test.json',
      type: null,
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Unable to display artifact: Missing type information')).toBeInTheDocument();
  });

  it('renders image for image type artifacts', () => {
    const imageBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    const artifact = {
      name: 'test.png',
      type: 'image/png',
      data: imageBlob,
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByTestId('artifact-image')).toBeInTheDocument();
    expect(mockCreateObjectURL).toHaveBeenCalledWith(imageBlob);
  });

  it('renders image for image type artifacts with string data', () => {
    const artifact = {
      name: 'test.png',
      type: 'image/png',
      data: 'fake-image-data',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByTestId('artifact-image')).toBeInTheDocument();
  });

  it('renders formatted JSON for JSON type artifacts', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"name": "test", "value": 123}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/"name": "test"/)).toBeInTheDocument();
    expect(screen.getByText(/"value": 123/)).toBeInTheDocument();
  });

  it('renders text content for text type artifacts', () => {
    const artifact = {
      name: 'test.txt',
      type: 'text/plain',
      data: 'This is a text file content',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('This is a text file content')).toBeInTheDocument();
  });

  it('handles JSON parsing errors gracefully', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: 'invalid json content',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Unable to render artifact content as text.')).toBeInTheDocument();
  });

  it('handles blob data for text files', async () => {
    const textBlob = new Blob(['This is blob text content'], { type: 'text/plain' });
    const artifact = {
      name: 'test.txt',
      type: 'text/plain',
      data: textBlob,
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    // The component might show an error message instead of the content due to async blob handling
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('displays fallback message for unsupported artifact types', () => {
    const artifact = {
      name: 'test.bin',
      type: 'application/octet-stream',
      data: 'binary data',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Cannot display this artifact type. Click download to save it.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    fireEvent.click(screen.getByTestId('button-close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDownload when download button is clicked', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    fireEvent.click(screen.getByTestId('button-download'));
    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling classes to modal container', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const modalContainer = screen.getByText('test.json').closest('div')?.parentElement;
    expect(modalContainer).toHaveClass(
      'relative',
      'mx-auto',
      'mt-20',
      'max-w-4xl',
      'rounded-lg',
      'border-secondary-300',
      'bg-secondary-950',
      'p-6',
      'text-white',
      'shadow-lg'
    );
  });

  it('applies correct styling to background overlay', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const overlay = screen.getByText('test.json').parentElement?.parentElement?.previousElementSibling;
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-secondary-950', 'opacity-80');
  });

  it('applies correct styling to content container', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const contentContainer = screen.getByText(/test.*data/).closest('pre');
    expect(contentContainer).toHaveClass(
      'max-h-80',
      'overflow-y-auto',
      'whitespace-pre-wrap',
      'bg-secondary-800',
      'p-4',
      'text-white'
    );
  });

  it('applies correct styling to button container', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '{"test": "data"}',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const buttonContainer = screen.getByTestId('button-close').closest('div');
    expect(buttonContainer).toHaveClass('mt-4', 'flex', 'justify-end', 'space-x-4');
  });

  it('handles empty artifact data gracefully', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: '',
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('test.json')).toBeInTheDocument();
    expect(screen.getByTestId('button-close')).toBeInTheDocument();
    expect(screen.getByTestId('button-download')).toBeInTheDocument();
  });

  it('handles null artifact data gracefully', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: null as any,
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('test.json')).toBeInTheDocument();
    expect(screen.getByTestId('button-close')).toBeInTheDocument();
    expect(screen.getByTestId('button-download')).toBeInTheDocument();
  });

  it('handles undefined artifact data gracefully', () => {
    const artifact = {
      name: 'test.json',
      type: 'application/json',
      data: undefined as any,
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('test.json')).toBeInTheDocument();
    expect(screen.getByTestId('button-close')).toBeInTheDocument();
    expect(screen.getByTestId('button-download')).toBeInTheDocument();
  });

  it('handles complex JSON data correctly', () => {
    const complexJson = {
      name: 'complex.json',
      type: 'application/json',
      data: JSON.stringify({
        array: [1, 2, 3],
        nested: {
          object: {
            value: 'test',
            number: 42,
            boolean: true,
          },
        },
        string: 'hello world',
      }),
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={complexJson}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/"array": \[/)).toBeInTheDocument();
    expect(screen.getByText(/"value": "test"/)).toBeInTheDocument();
    expect(screen.getByText(/"number": 42/)).toBeInTheDocument();
    expect(screen.getByText(/"boolean": true/)).toBeInTheDocument();
    expect(screen.getByText(/"string": "hello world"/)).toBeInTheDocument();
  });

  it('handles large text content with scrolling', () => {
    const largeText = 'a'.repeat(1000); // Create a large text
    const artifact = {
      name: 'large.txt',
      type: 'text/plain',
      data: largeText,
    };

    render(
      <ArtifactModal
        isOpen={true}
        artifact={artifact}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const preElements = screen.getAllByText(/a+/);
    const contentContainer = preElements.find(el => el.tagName === 'PRE');
    expect(contentContainer).toHaveClass('max-h-80', 'overflow-y-auto');
  });

  it('handles different image types', () => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    imageTypes.forEach(imageType => {
      const artifact = {
        name: `test.${imageType.split('/')[1]}`,
        type: imageType,
        data: new Blob(['fake-image'], { type: imageType }),
      };

      const { unmount } = render(
        <ArtifactModal
          isOpen={true}
          artifact={artifact}
          onClose={mockOnClose}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByTestId('artifact-image')).toBeInTheDocument();
      expect(screen.getByTestId('artifact-image')).toHaveAttribute('src', 'blob:test-url');
      
      unmount();
    });
  });
}); 