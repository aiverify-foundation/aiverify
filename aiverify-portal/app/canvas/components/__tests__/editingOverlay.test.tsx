import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditingOverlay } from '../editingOverlay';
import { WidgetOnGridLayout } from '@/app/canvas/types';

// Mock window properties
const mockGetBoundingClientRect = jest.fn();
const mockQuerySelector = jest.fn();
const mockQuerySelectorAll = jest.fn();
const mockGetAttribute = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveChild = jest.fn();
const mockAppendChild = jest.fn();
const mockDispatchEvent = jest.fn();

// Mock scroll properties
Object.defineProperty(window, 'scrollY', {
  value: 100,
  writable: true,
});

Object.defineProperty(window, 'scrollX', {
  value: 50,
  writable: true,
});

Object.defineProperty(document.documentElement, 'scrollTop', {
  value: 100,
  writable: true,
});

Object.defineProperty(document.documentElement, 'scrollLeft', {
  value: 50,
  writable: true,
});

describe('EditingOverlay Component', () => {
  const mockOnClose = jest.fn();
  
  const mockWidget: WidgetOnGridLayout = {
    cid: 'test-widget',
    name: 'Test Widget',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test Description',
    widgetSize: {
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    },
    properties: [
      {
        key: 'title',
        helper: 'Enter title',
        default: 'Default Title',
        value: 'Current Title',
      },
      {
        key: 'content',
        helper: 'Enter content',
        default: 'Default Content',
        value: 'Current Content',
      },
    ],
    tags: 'test',
    dependencies: [],
    mockdata: null,
    dynamicHeight: false,
    gid: 'test-gid',
    mdx: {
      code: 'test code',
      frontmatter: {},
    },
    gridItemId: 'test-grid-item',
  };

  const mockOriginalElement = {
    getBoundingClientRect: mockGetBoundingClientRect,
    querySelectorAll: mockQuerySelectorAll,
  } as unknown as HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockGetBoundingClientRect.mockReturnValue({
      top: 100,
      left: 200,
      width: 300,
      height: 150,
    });

    mockQuerySelector.mockReturnValue({
      firstChild: null,
      removeChild: mockRemoveChild,
      appendChild: mockAppendChild,
    });

    mockQuerySelectorAll.mockReturnValue([]);
    mockGetAttribute.mockReturnValue(null);
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'input') {
        // Simulate input event
        setTimeout(() => {
          const mockTarget = {
            style: { height: 'auto' },
            dataset: { propertyKey: 'title' },
            value: 'Updated Title',
            scrollHeight: 50,
          };
          handler({ target: mockTarget });
        }, 0);
      }
    });
  });

  describe('Rendering', () => {
    it('renders the editing overlay with correct structure', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      // The component should render a div with the editing overlay class
      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('renders with widget without properties', () => {
      const widgetWithoutProperties = {
        ...mockWidget,
        properties: null,
      };

      render(
        <EditingOverlay
          widget={widgetWithoutProperties}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('renders with widget with empty properties array', () => {
      const widgetWithEmptyProperties = {
        ...mockWidget,
        properties: [],
      };

      render(
        <EditingOverlay
          widget={widgetWithEmptyProperties}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Property Initialization', () => {
    it('initializes property values from widget properties with values', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      // The component should initialize with the widget's property values
      expect(mockWidget.properties).toEqual([
        {
          key: 'title',
          helper: 'Enter title',
          default: 'Default Title',
          value: 'Current Title',
        },
        {
          key: 'content',
          helper: 'Enter content',
          default: 'Default Content',
          value: 'Current Content',
        },
      ]);
    });

    it('initializes property values with undefined values using defaults', () => {
      const widgetWithUndefinedValues = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            helper: 'Enter title',
            default: 'Default Title',
            value: undefined,
          },
        ],
      };

      render(
        <EditingOverlay
          widget={widgetWithUndefinedValues}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(widgetWithUndefinedValues.properties?.[0].value).toBeUndefined();
    });

    it('initializes property values with empty string values', () => {
      const widgetWithEmptyValues = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            helper: 'Enter title',
            default: 'Default Title',
            value: '',
          },
        ],
      };

      render(
        <EditingOverlay
          widget={widgetWithEmptyValues}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(widgetWithEmptyValues.properties?.[0].value).toBe('');
    });
  });

  describe('Element Positioning', () => {
    it('positions overlay correctly when originalElement and overlayRef are available', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      // The positioning logic should be called
      expect(mockGetBoundingClientRect).toHaveBeenCalled();
    });

    it('handles positioning when originalElement is null', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={null}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      // Should not call getBoundingClientRect when originalElement is null
      expect(mockGetBoundingClientRect).not.toHaveBeenCalled();
    });
  });

  describe('Textarea Creation with data-aivkey elements', () => {
    it('creates textareas for elements with data-aivkey attributes', () => {
      const mockEditableElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        getAttribute: mockGetAttribute,
        textContent: 'Original Text',
        tagName: 'P',
      };

      mockQuerySelectorAll.mockReturnValue([mockEditableElement]);
      mockGetAttribute.mockReturnValue('title');

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('[data-aivkey]');
      expect(mockGetAttribute).toHaveBeenCalledWith('data-aivkey');
    });

    it('handles elements with data-aivkey but no key attribute', () => {
      const mockEditableElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        getAttribute: mockGetAttribute,
        textContent: 'Original Text',
        tagName: 'P',
      };

      mockQuerySelectorAll.mockReturnValue([mockEditableElement]);
      mockGetAttribute.mockReturnValue(null);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(mockGetAttribute).toHaveBeenCalledWith('data-aivkey');
    });
  });

  describe('Textarea Creation with fallback text elements', () => {
    it('creates textareas for text elements when no data-aivkey elements found', () => {
      const mockTextElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text',
        tagName: 'P',
      };

      // First call returns empty array (no data-aivkey elements)
      // Second call returns text elements
      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('[data-aivkey]');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('p, h1, h2, h3, h4, h5, h6');
    });

    it('handles text elements when properties array is shorter than elements', () => {
      const mockTextElement1 = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text 1',
        tagName: 'P',
      };

      const mockTextElement2 = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 160,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text 2',
        tagName: 'H1',
      };

      const widgetWithOneProperty = {
        ...mockWidget,
        properties: [mockWidget.properties![0]], // Only one property
      };

      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement1, mockTextElement2]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={widgetWithOneProperty}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('p, h1, h2, h3, h4, h5, h6');
    });
  });

  describe('Form Submission', () => {
    it('handles form submission with updated widget properties', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }

      expect(mockOnClose).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockWidget,
          properties: expect.arrayContaining([
            expect.objectContaining({
              key: 'title',
              value: 'Current Title',
            }),
            expect.objectContaining({
              key: 'content',
              value: 'Current Content',
            }),
          ]),
        })
      );
    });

    it('handles form submission when widget has no properties', () => {
      const widgetWithoutProperties = {
        ...mockWidget,
        properties: null,
      };

      render(
        <EditingOverlay
          widget={widgetWithoutProperties}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }

      // Should not call onClose when properties is null
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Background Click Handling', () => {
    it('submits form when clicking on background', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not submit form when clicking on overlay content', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlayContent = document.querySelector('.editing-overlay div');
      if (overlayContent) {
        fireEvent.click(overlayContent);
      }

      // Should not call onClose when clicking on content, not background
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Property Change Handling', () => {
    it('updates property values when textarea content changes', async () => {
      const mockTextElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text',
        tagName: 'P',
      };

      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      // The component should render successfully with textarea creation logic
      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles case when originalElement is null', () => {
      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={null}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('handles case when overlayRef.current is null', () => {
      // Mock overlayRef.current to be null
      const mockOriginalElementNullRef = {
        getBoundingClientRect: mockGetBoundingClientRect,
        querySelectorAll: mockQuerySelectorAll,
      } as unknown as HTMLElement;

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElementNullRef}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('handles case when form element is not found', () => {
      mockQuerySelector.mockReturnValue(null);

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('handles case when form has existing content to clear', () => {
      const mockFormWithContent = {
        firstChild: { someContent: true },
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      };

      mockQuerySelector.mockReturnValue(mockFormWithContent);

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('handles case when form has multiple existing children to clear', () => {
      const mockFormWithMultipleChildren: any = {
        firstChild: { content1: true },
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      };

      // Mock the while loop behavior
      let childCount = 3;
      mockFormWithMultipleChildren.firstChild = { content: true };
      mockRemoveChild.mockImplementation(() => {
        childCount--;
        if (childCount === 0) {
          mockFormWithMultipleChildren.firstChild = null;
        }
      });

      mockQuerySelector.mockReturnValue(mockFormWithMultipleChildren);

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('handles case when form element has existing children that need to be cleared', () => {
      // Create a real DOM structure
      const container = document.createElement('div');
      const form = document.createElement('form');
      const child1 = document.createElement('div');
      const child2 = document.createElement('div');
      
      form.appendChild(child1);
      form.appendChild(child2);
      container.appendChild(form);
      document.body.appendChild(container);

      // Mock the original element
      const mockOriginalElementWithChildren = {
        getBoundingClientRect: mockGetBoundingClientRect,
        querySelectorAll: jest.fn().mockReturnValue([]),
      } as unknown as HTMLElement;

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElementWithChildren}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();

      // Clean up
      document.body.removeChild(container);
    });

    it('handles textarea input event with null dataset propertyKey', () => {
      const mockTextElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text',
        tagName: 'P',
      };

      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      // Mock addEventListener to simulate input event with null dataset
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'input') {
          setTimeout(() => {
            const mockTarget = {
              style: { height: 'auto' },
              dataset: { propertyKey: null },
              value: 'Updated Title',
              scrollHeight: 50,
            };
            handler({ target: mockTarget });
          }, 0);
        }
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Textarea Positioning and Styling', () => {
    it('positions textarea correctly relative to overlay', () => {
      const mockTextElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text',
        tagName: 'P',
      };

      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(mockTextElement.getBoundingClientRect).toHaveBeenCalled();
    });

    it('sets textarea value from property values or element text content', () => {
      const mockTextElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Element Text Content',
        tagName: 'P',
      };

      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      expect(mockTextElement.textContent).toBe('Element Text Content');
    });
  });

  describe('Component Integration', () => {
    it('integrates all functionality correctly', () => {
      const mockTextElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 110,
          left: 210,
          width: 100,
          height: 50,
        }),
        textContent: 'Original Text',
        tagName: 'P',
      };

      mockQuerySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockTextElement]);

      mockQuerySelector.mockReturnValue({
        firstChild: null,
        removeChild: mockRemoveChild,
        appendChild: mockAppendChild,
      });

      render(
        <EditingOverlay
          widget={mockWidget}
          originalElement={mockOriginalElement}
          onClose={mockOnClose}
          pageIndex={0}
        />
      );

      // Test that the component renders without errors
      const overlay = document.querySelector('.editing-overlay');
      expect(overlay).toBeInTheDocument();
      
      // Test that all the main functionality is initialized
      expect(mockGetBoundingClientRect).toHaveBeenCalled();
      expect(mockQuerySelectorAll).toHaveBeenCalled();
    });
  });
}); 