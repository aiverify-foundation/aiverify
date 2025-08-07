import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MDXComponentWrapper from '../MDXComponentWrapper';

// Mock the getMDXComponent function
jest.mock('mdx-bundler/client', () => ({
  getMDXComponent: jest.fn((code: string) => {
    return jest.fn((props: any) => {
      // Remove the code prop from the props passed to the component
      const { code: _, ...componentProps } = props;
      return React.createElement('div', { 'data-testid': 'mdx-component', ...componentProps }, 'Mocked MDX Content');
    });
  }),
}));

describe('MDXComponentWrapper', () => {
  const mockCode = 'export default function TestComponent() { return <div>Test</div> }';
  const mockComponent = jest.fn((props: any) => {
    // Remove the code prop from the props passed to the component
    const { code: _, ...componentProps } = props;
    return React.createElement('div', { 'data-testid': 'test-component', ...componentProps }, 'Test Component');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the MDX component with converted props', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          className="test-class"
          htmlFor="test-for"
          style={{ color: 'red' }}
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: 'test-class',
        htmlFor: 'test-for',
        style: { color: 'red' },
      }, undefined);
    });

    it('renders with no props when none provided', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
      }, undefined);
    });

    it('converts class to className', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class="my-class"
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: 'my-class',
      }, undefined);
    });

    it('converts for to htmlFor', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          for="my-label"
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        htmlFor: 'my-label',
      }, undefined);
    });

    it('preserves other props unchanged', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          id="test-id"
          data-testid="test-element"
          onClick={() => {}}
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        id: 'test-id',
        'data-testid': 'test-element',
        onClick: expect.any(Function),
      }, undefined);
    });

    it('handles multiple HTML attribute conversions', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class="container"
          for="input-field"
          tabindex="0"
          readonly="true"
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: 'container',
        htmlFor: 'input-field',
        tabIndex: '0',
        readOnly: true,
      }, undefined);
    });

    it('handles empty string values', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class=""
          for=""
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: '',
        htmlFor: '',
      }, undefined);
    });

    it('handles undefined and null values', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class={undefined}
          for={null}
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: undefined,
        htmlFor: null,
      }, undefined);
    });

    it('handles complex props with mixed types', () => {
      const mockFunction = jest.fn();
      const mockObject = { key: 'value' };

      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class="test-class"
          for="test-for"
          onClick={mockFunction}
          data={mockObject}
          disabled={true}
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: 'test-class',
        htmlFor: 'test-for',
        onClick: mockFunction,
        data: mockObject,
        disabled: true,
      }, undefined);
    });
  });

  describe('edge cases', () => {
    it('handles component that returns null', () => {
      const nullComponent = jest.fn(() => null);
      
      const { container } = render(
        <MDXComponentWrapper 
          code={mockCode}
          component={nullComponent}
          class="test-class"
        />
      );

      expect(nullComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: 'test-class',
      }, undefined);
      expect(container.firstChild).toBeNull();
    });

    it('handles very long prop values', () => {
      const longClass = 'a'.repeat(1000);
      const longFor = 'b'.repeat(1000);

      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class={longClass}
          for={longFor}
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: longClass,
        htmlFor: longFor,
      }, undefined);
    });

    it('handles special characters in prop values', () => {
      render(
        <MDXComponentWrapper 
          code={mockCode}
          component={mockComponent}
          class="class-with-special-chars-!@#$%^&*()"
          for="for-with-special-chars-!@#$%^&*()"
        />
      );

      expect(mockComponent).toHaveBeenCalledWith({
        code: mockCode,
        className: 'class-with-special-chars-!@#$%^&*()',
        htmlFor: 'for-with-special-chars-!@#$%^&*()',
      }, undefined);
    });
  });

  describe('prop validation', () => {
    it('requires component prop', () => {
      // @ts-ignore - Testing missing required prop
      expect(() => render(<MDXComponentWrapper code={mockCode} />)).toThrow();
    });
  });
}); 