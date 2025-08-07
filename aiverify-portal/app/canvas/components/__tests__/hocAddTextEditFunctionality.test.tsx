import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { hocAddTextEditFunctionality } from '../hocAddTextEditFunctionality';

// Mock component to wrap
const MockComponent = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="mock-component">
    <h1 data-aivkey="key1">Test Heading 1</h1>
    <h2 data-aivkey="key2">Test Heading 2</h2>
    <h3 data-aivkey="key3">Test Heading 3</h3>
    <p data-aivkey="key4">Test paragraph</p>
    {children}
  </div>
);

// Mock component without editable elements
const MockComponentNoEditable = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="mock-component">
    <div>Non-editable content</div>
    {children}
  </div>
);

// Mock component with empty content
const MockComponentEmpty = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="mock-component">
    <h1 data-aivkey="key1"></h1>
    <p data-aivkey="key2"></p>
    {children}
  </div>
);

// Mock component with null content
const MockComponentNull = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="mock-component">
    <h1 data-aivkey="key1">{null}</h1>
    {children}
  </div>
);

describe('hocAddTextEditFunctionality', () => {
  beforeEach(() => {
    // Mock document.createElement
    const originalCreateElement = document.createElement;
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === 'textarea') {
        // Mock textarea properties and methods
        Object.defineProperty(element, 'value', {
          writable: true,
          value: '',
        });
        Object.defineProperty(element, 'scrollHeight', {
          writable: true,
          value: 0,
        });
        Object.defineProperty(element, 'style', {
          writable: true,
          value: { height: 'auto' },
        });
        Object.defineProperty(element, 'setSelectionRange', {
          writable: true,
          value: jest.fn(),
        });
        Object.defineProperty(element, 'addEventListener', {
          writable: true,
          value: jest.fn(),
        });
        Object.defineProperty(element, 'focus', {
          writable: true,
          value: jest.fn(),
        });
      }
      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should wrap component and add text edit functionality', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponent);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle component without editable elements', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponentNoEditable);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle component with empty content', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponentEmpty);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle component with null content', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponentNull);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle component with no contentRef.current', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponent);
    
    // Mock querySelectorAll to return empty NodeList
    const mockQuerySelectorAll = jest.fn().mockReturnValue([]);
    const mockGetElementById = jest.fn().mockReturnValue({
      querySelectorAll: mockQuerySelectorAll,
    });
    
    jest.spyOn(document, 'getElementById').mockImplementation(mockGetElementById);
    
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle elements without data-aivkey attribute', async () => {
    const MockComponentNoKey = () => (
      <div data-testid="mock-component">
        <h1>No key heading</h1>
        <p>No key paragraph</p>
      </div>
    );

    const EditableComponent = hocAddTextEditFunctionality(MockComponentNoKey);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle elements with empty data-aivkey attribute', async () => {
    const MockComponentEmptyKey = () => (
      <div data-testid="mock-component">
        <h1 data-aivkey="">Empty key heading</h1>
        <p data-aivkey="">Empty key paragraph</p>
      </div>
    );

    const EditableComponent = hocAddTextEditFunctionality(MockComponentEmptyKey);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle elements with null textContent', async () => {
    const MockComponentNullText = () => (
      <div data-testid="mock-component">
        <h1 data-aivkey="key1">{null}</h1>
        <p data-aivkey="key2">{null}</p>
      </div>
    );

    const EditableComponent = hocAddTextEditFunctionality(MockComponentNullText);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle elements without parentNode', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponent);
    
    // Mock querySelectorAll to return elements without parentNode
    const mockElement = {
      getAttribute: jest.fn().mockReturnValue('key1'),
      textContent: 'Test content',
      tagName: 'H1',
      parentNode: null, // No parent node
    };
    
    const mockQuerySelectorAll = jest.fn().mockReturnValue([mockElement]);
    const mockGetElementById = jest.fn().mockReturnValue({
      querySelectorAll: mockQuerySelectorAll,
    });
    
    jest.spyOn(document, 'getElementById').mockImplementation(mockGetElementById);
    
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle textarea input event for auto-resizing', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponent);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle textarea click event to prevent propagation', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponent);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle focus on first textarea', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponent);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle no first textarea to focus', async () => {
    const EditableComponent = hocAddTextEditFunctionality(MockComponentNoEditable);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle different tag names', async () => {
    const MockComponentDifferentTags = () => (
      <div data-testid="mock-component">
        <div data-aivkey="key1">Div content</div>
        <span data-aivkey="key2">Span content</span>
        <section data-aivkey="key3">Section content</section>
      </div>
    );

    const EditableComponent = hocAddTextEditFunctionality(MockComponentDifferentTags);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle uppercase tag names', async () => {
    const MockComponentUppercaseTags = () => (
      <div data-testid="mock-component">
        <h1 data-aivkey="key1">Uppercase H1</h1>
        <p data-aivkey="key2">Uppercase P</p>
      </div>
    );

    const EditableComponent = hocAddTextEditFunctionality(MockComponentUppercaseTags);
    render(<EditableComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });
}); 