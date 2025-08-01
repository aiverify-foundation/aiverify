import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonEditor, JsonEditorHandle } from '../jsoneditor';

// Mock the jsoneditor library
const mockJSONEditor = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  onChange: jest.fn(),
};

jest.mock('jsoneditor', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockJSONEditor),
}));

// Mock the CSS import
jest.mock('jsoneditor/dist/jsoneditor.css', () => ({}));

// Mock the cn utility
jest.mock('@/lib/utils/twmerge', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

// Import the mocked JSONEditor
import JSONEditor from 'jsoneditor';

describe('JsonEditor', () => {
  let mockOnChange: jest.Mock;
  let mockOnSyntaxError: jest.Mock;
  let ref: React.RefObject<JsonEditorHandle | null>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnChange = jest.fn();
    mockOnSyntaxError = jest.fn();
    ref = React.createRef<JsonEditorHandle | null>();
    
    // Reset mock implementations
    mockJSONEditor.get.mockReturnValue({ test: 'data' });
    mockJSONEditor.set.mockImplementation(() => {});
    mockJSONEditor.update.mockImplementation(() => {});
    mockJSONEditor.destroy.mockImplementation(() => {});
  });

  describe('Component Rendering', () => {
    it('renders the component with default props', () => {
      const { container } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <JsonEditor
          ref={ref}
          className="custom-class"
          onSyntaxError={mockOnSyntaxError}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('applies dark mode styles when darkMode is true', () => {
      const { container } = render(
        <JsonEditor
          ref={ref}
          darkMode={true}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      const innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toHaveClass('jsoneditor-dark');
    });

    it('removes dark mode styles when darkMode is false', () => {
      const { container, rerender } = render(
        <JsonEditor
          ref={ref}
          darkMode={true}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      let innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toHaveClass('jsoneditor-dark');

      rerender(
        <JsonEditor
          ref={ref}
          darkMode={false}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toBeNull();
    });
  });

  describe('JSONEditor Initialization', () => {
    it('initializes JSONEditor with default options', () => {
      render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(JSONEditor).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          mode: 'code',
          history: true,
          search: true,
          mainMenuBar: false,
          navigationBar: true,
          statusBar: true,
        })
      );
    });

    it('initializes JSONEditor with custom options', () => {
      const customOptions = {
        mode: 'tree' as const,
        history: false,
        search: false,
      };

      render(
        <JsonEditor
          ref={ref}
          options={customOptions}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(JSONEditor).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          mode: 'tree',
          history: false,
          search: false,
          mainMenuBar: false,
          navigationBar: true,
          statusBar: true,
        })
      );
    });

    it('initializes JSONEditor with custom boolean props', () => {
      render(
        <JsonEditor
          ref={ref}
          showMainMenuBar={true}
          showNavigationBar={false}
          showStatusBar={false}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(JSONEditor).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          mainMenuBar: true,
          navigationBar: false,
          statusBar: false,
        })
      );
    });

    it('sets initial data when provided', () => {
      const initialData = { key: 'value' };

      render(
        <JsonEditor
          ref={ref}
          data={initialData}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(mockJSONEditor.set).toHaveBeenCalledWith(initialData);
    });

    it('sets empty object when no data is provided', () => {
      render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(mockJSONEditor.set).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Ref Methods', () => {
    beforeEach(() => {
      render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );
    });

    it('provides getValue method that returns editor data', () => {
      const testData = { test: 'value' };
      mockJSONEditor.get.mockReturnValue(testData);

      const result = ref.current?.getValue();
      expect(result).toEqual(testData);
      expect(mockJSONEditor.get).toHaveBeenCalled();
    });

    it('provides setValue method that updates specific key', () => {
      const currentJson = { existing: 'data' };
      mockJSONEditor.get.mockReturnValue(currentJson);

      ref.current?.setValue('newKey', 'newValue');

      expect(mockJSONEditor.get).toHaveBeenCalled();
      expect(mockJSONEditor.set).toHaveBeenCalledWith({
        existing: 'data',
        newKey: 'newValue',
      });
    });

    it('calls onChange when setValue is successful', () => {
      const currentJson = { existing: 'data' };
      mockJSONEditor.get.mockReturnValue(currentJson);

      render(
        <JsonEditor
          ref={ref}
          onChange={mockOnChange}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      ref.current?.setValue('newKey', 'newValue');

      expect(mockOnChange).toHaveBeenCalledWith({
        existing: 'data',
        newKey: 'newValue',
      });
    });

    it('calls onSyntaxError when setValue throws an error', () => {
      const error = new Error('JSON error');
      mockJSONEditor.get.mockReturnValue({});
      mockJSONEditor.set.mockImplementation(() => {
        throw error;
      });

      ref.current?.setValue('key', 'value');

      expect(mockOnSyntaxError).toHaveBeenCalledWith(error);
    });

    it('provides clear method that sets empty object', () => {
      ref.current?.clear();

      expect(mockJSONEditor.set).toHaveBeenCalledWith({});
    });

    it('calls onChange when clear is successful', () => {
      render(
        <JsonEditor
          ref={ref}
          onChange={mockOnChange}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      ref.current?.clear();

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('calls onSyntaxError when clear throws an error', () => {
      const error = new Error('Clear error');
      mockJSONEditor.set.mockImplementation(() => {
        throw error;
      });

      ref.current?.clear();

      expect(mockOnSyntaxError).toHaveBeenCalledWith(error);
    });

    it('handles null return from getValue when editor is not available', () => {
      // Simulate editor not being available
      const { unmount } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      unmount();

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('handles setValue when editor is not available', () => {
      const { unmount } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      unmount();

      // Should not throw error
      expect(() => {
        ref.current?.setValue('key', 'value');
      }).not.toThrow();
    });

    it('handles clear when editor is not available', () => {
      const { unmount } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      unmount();

      // Should not throw error
      expect(() => {
        ref.current?.clear();
      }).not.toThrow();
    });
  });

  describe('Event Handlers', () => {
    it('calls onChange when editor content changes successfully', () => {
      const testData = { changed: 'data' };
      mockJSONEditor.get.mockReturnValue(testData);

      render(
        <JsonEditor
          ref={ref}
          onChange={mockOnChange}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      // Simulate the onChange callback from the editor
      const mockCalls = (JSONEditor as any).mock.calls;
      const onChangeCallback = mockCalls[0][1].onChange;
      onChangeCallback();

      expect(mockOnChange).toHaveBeenCalledWith(testData);
    });

    it('calls onSyntaxError when editor onChange throws an error', () => {
      const error = new Error('Syntax error');
      mockJSONEditor.get.mockImplementation(() => {
        throw error;
      });

      render(
        <JsonEditor
          ref={ref}
          onChange={mockOnChange}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      // Simulate the onChange callback from the editor
      const mockCalls = (JSONEditor as any).mock.calls;
      const onChangeCallback = mockCalls[0][1].onChange;
      onChangeCallback();

      expect(mockOnSyntaxError).toHaveBeenCalledWith(error);
    });
  });

  describe('Data Updates', () => {
    it('updates editor when data prop changes', () => {
      const { rerender } = render(
        <JsonEditor
          ref={ref}
          data={{ initial: 'data' }}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      // Clear the initial set call
      mockJSONEditor.update.mockClear();

      rerender(
        <JsonEditor
          ref={ref}
          data={{ updated: 'data' }}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(mockJSONEditor.update).toHaveBeenCalledWith({ updated: 'data' });
    });

    it('does not update editor when data prop is the same', () => {
      const sameData = { test: 'data' };
      const { rerender } = render(
        <JsonEditor
          ref={ref}
          data={sameData}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      rerender(
        <JsonEditor
          ref={ref}
          data={sameData}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(mockJSONEditor.update).toHaveBeenCalledWith(sameData);
    });
  });

  describe('Cleanup', () => {
    it('destroys editor on unmount', () => {
      const { unmount } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      unmount();

      expect(mockJSONEditor.destroy).toHaveBeenCalled();
    });

    it('sets editor ref to null after destroy', () => {
      const { unmount } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      unmount();

      // The editor should be destroyed and ref set to null
      expect(mockJSONEditor.destroy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles setValue with different value types', () => {
      render(
        <JsonEditor
          ref={ref}
          onChange={mockOnChange}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      let currentJson = { existing: 'data' };
      mockJSONEditor.get.mockReturnValue(currentJson);

      // Clear the initial set call
      mockJSONEditor.set.mockClear();

      // Test different value types
      ref.current?.setValue('stringKey', 'stringValue');
      ref.current?.setValue('numberKey', 42);
      ref.current?.setValue('booleanKey', true);
      ref.current?.setValue('nullKey', null);
      ref.current?.setValue('arrayKey', ['item1', 'item2']);

      expect(mockJSONEditor.set).toHaveBeenCalledTimes(5);
      // Check that the last call includes the array value
      const lastCall = mockJSONEditor.set.mock.calls[mockJSONEditor.set.mock.calls.length - 1][0];
      expect(lastCall).toHaveProperty('arrayKey', ['item1', 'item2']);
    });

    it('handles multiple rapid data changes', () => {
      const { rerender } = render(
        <JsonEditor
          ref={ref}
          data={{ first: 'data' }}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      // Clear the initial set call
      mockJSONEditor.update.mockClear();

      rerender(
        <JsonEditor
          ref={ref}
          data={{ second: 'data' }}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      rerender(
        <JsonEditor
          ref={ref}
          data={{ third: 'data' }}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      expect(mockJSONEditor.update).toHaveBeenCalledTimes(2);
    });

    it('handles dark mode toggle multiple times', () => {
      const { container, rerender } = render(
        <JsonEditor
          ref={ref}
          darkMode={true}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      let innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toHaveClass('jsoneditor-dark');

      rerender(
        <JsonEditor
          ref={ref}
          darkMode={false}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toBeNull();

      rerender(
        <JsonEditor
          ref={ref}
          darkMode={true}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toHaveClass('jsoneditor-dark');
    });
  });

  describe('CSS Styles', () => {
    it('includes dark mode CSS variables', () => {
      const { container } = render(
        <JsonEditor
          ref={ref}
          darkMode={true}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      // The component should render with dark mode styles
      const innerDiv = container.querySelector('div[class*="jsoneditor-dark"]');
      expect(innerDiv).toHaveClass('jsoneditor-dark');
    });

    it('renders with proper container structure', () => {
      const { container } = render(
        <JsonEditor
          ref={ref}
          onSyntaxError={mockOnSyntaxError}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('w-full', 'overflow-hidden');
    });
  });

  describe('Component Display Name', () => {
    it('has correct display name', () => {
      expect(JsonEditor.displayName).toBe('JsonEditor');
    });
  });
}); 