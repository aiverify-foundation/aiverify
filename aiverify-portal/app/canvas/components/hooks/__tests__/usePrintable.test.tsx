import { renderHook, act } from '@testing-library/react';
import { usePrintable } from '../usePrintable';

// Mock window.print
const mockPrint = jest.fn();
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true,
});

describe('usePrintable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing elements
    const existingContainer = document.getElementById('printable-content');
    if (existingContainer) {
      existingContainer.remove();
    }
  });

  it('should return contentRef and print function', () => {
    const { result } = renderHook(() => usePrintable());

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
    expect(typeof result.current.print).toBe('function');
  });

  it('should use default options when none provided', () => {
    const { result } = renderHook(() => usePrintable());

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should use custom options when provided', () => {
    const customOptions = {
      printableId: 'custom-printable',
      filename: 'custom-document.pdf',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle empty options', () => {
    const { result } = renderHook(() => usePrintable({}));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle undefined options', () => {
    const { result } = renderHook(() => usePrintable(undefined as any));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  describe('print function execution', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should execute print function with default options', () => {
      const { result } = renderHook(() => usePrintable());

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should execute print function with custom options', () => {
      const customOptions = {
        printableId: 'custom-printable',
        filename: 'custom-document.pdf',
      };

      const { result } = renderHook(() => usePrintable(customOptions));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle filename with .pdf extension', () => {
      const customOptions = {
        filename: 'test-document.pdf',
      };

      const { result } = renderHook(() => usePrintable(customOptions));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle filename without .pdf extension', () => {
      const customOptions = {
        filename: 'test-document',
      };

      const { result } = renderHook(() => usePrintable(customOptions));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle empty filename', () => {
      const customOptions = {
        filename: '',
      };

      const { result } = renderHook(() => usePrintable(customOptions));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle whitespace filename', () => {
      const customOptions = {
        filename: '   ',
      };

      const { result } = renderHook(() => usePrintable(customOptions));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle contentRef.current being null', () => {
      const { result } = renderHook(() => usePrintable());

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle contentRef.current with content', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element
      const mockContent = document.createElement('div');
      mockContent.innerHTML = '<div class="standard-report-page">Test content</div>';
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle content with grid layout', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element with grid layout
      const mockContent = document.createElement('div');
      mockContent.innerHTML = `
        <div class="standard-report-page">
          <div class="react-grid-layout">
            <div class="react-grid-item" style="transform: translate(10px, 20px)">Item 1</div>
            <div class="react-grid-item" style="transform: translate(5px, 10px)">Item 2</div>
          </div>
        </div>
      `;
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle content with grid items having 100vh height', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element with grid items having 100vh height
      const mockContent = document.createElement('div');
      mockContent.innerHTML = `
        <div class="standard-report-page">
          <div class="react-grid-layout">
            <div class="react-grid-item">
              <div style="height: 100vh">Full height item</div>
            </div>
          </div>
        </div>
      `;
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle content with multiple grid layouts', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element with multiple grid layouts
      const mockContent = document.createElement('div');
      mockContent.innerHTML = `
        <div class="standard-report-page">
          <div class="react-grid-layout">Layout 1</div>
          <div class="react-grid-layout">Layout 2</div>
        </div>
      `;
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle existing printable container', () => {
      // Create an existing container
      const existingContainer = document.createElement('div');
      existingContainer.id = 'printable-content';
      document.body.appendChild(existingContainer);

      const { result } = renderHook(() => usePrintable());

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle custom printableId with existing container', () => {
      // Create an existing container with custom ID
      const existingContainer = document.createElement('div');
      existingContainer.id = 'custom-printable';
      document.body.appendChild(existingContainer);

      const customOptions = {
        printableId: 'custom-printable',
      };

      const { result } = renderHook(() => usePrintable(customOptions));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle grid items with invalid transform', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element with invalid transform
      const mockContent = document.createElement('div');
      mockContent.innerHTML = `
        <div class="standard-report-page">
          <div class="react-grid-layout">
            <div class="react-grid-item" style="transform: invalid">Item 1</div>
            <div class="react-grid-item" style="transform: translate(abc, def)">Item 2</div>
          </div>
        </div>
      `;
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle grid items with no transform', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element with no transform
      const mockContent = document.createElement('div');
      mockContent.innerHTML = `
        <div class="standard-report-page">
          <div class="react-grid-layout">
            <div class="react-grid-item">Item 1</div>
            <div class="react-grid-item">Item 2</div>
          </div>
        </div>
      `;
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle grid items with same y-coordinate', () => {
      const { result } = renderHook(() => usePrintable());

      // Create a mock content element with items on same row
      const mockContent = document.createElement('div');
      mockContent.innerHTML = `
        <div class="standard-report-page">
          <div class="react-grid-layout">
            <div class="react-grid-item" style="transform: translate(50px, 10px)">Item 1</div>
            <div class="react-grid-item" style="transform: translate(10px, 10px)">Item 2</div>
          </div>
        </div>
      `;
      result.current.contentRef.current = mockContent;

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle cleanup after print', () => {
      const { result } = renderHook(() => usePrintable());

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Fast-forward timers to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle cleanup with existing title element', () => {
      // Add a title element to the document
      const originalTitle = document.title;
      document.title = 'Original Title';

      const { result } = renderHook(() => usePrintable());

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Fast-forward timers to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle cleanup with added title element removal', () => {
      const { result } = renderHook(() => usePrintable({
        filename: 'test-document.pdf'
      }));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Fast-forward timers to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockPrint).toHaveBeenCalled();
    });

    it('should handle cleanup with specific title element removal scenario', () => {
      // Create a scenario where there's a title element without id that should be removed
      const existingTitle = document.createElement('title');
      existingTitle.textContent = 'Existing Title';
      document.head.appendChild(existingTitle);

      const { result } = renderHook(() => usePrintable({
        filename: 'test-document.pdf'
      }));

      act(() => {
        result.current.print();
      });

      // Fast-forward timers to trigger print
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Fast-forward timers to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockPrint).toHaveBeenCalled();
    });
  });
}); 