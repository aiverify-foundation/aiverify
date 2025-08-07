import React from 'react';
import { render, screen } from '@testing-library/react';
import { WidgetErrorBoundary } from '../widgetErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
};

// Component that doesn't throw an error
const NormalComponent = () => <div>Normal content</div>;

describe('WidgetErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <NormalComponent />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws an error', () => {
    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText('TestWidget failed to render')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should handle error with null error message', () => {
    // Mock getDerivedStateFromError to return null error
    const originalGetDerivedStateFromError = WidgetErrorBoundary.getDerivedStateFromError;
    WidgetErrorBoundary.getDerivedStateFromError = jest.fn().mockReturnValue({
      hasError: true,
      error: null,
    });

    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText('TestWidget failed to render')).toBeInTheDocument();

    // Restore original method
    WidgetErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
  });

  it('should handle error with undefined error message', () => {
    // Mock getDerivedStateFromError to return undefined error
    const originalGetDerivedStateFromError = WidgetErrorBoundary.getDerivedStateFromError;
    WidgetErrorBoundary.getDerivedStateFromError = jest.fn().mockReturnValue({
      hasError: true,
      error: undefined,
    });

    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText('TestWidget failed to render')).toBeInTheDocument();

    // Restore original method
    WidgetErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
  });

  it('should handle error with empty error message', () => {
    // Mock getDerivedStateFromError to return error with empty message
    const originalGetDerivedStateFromError = WidgetErrorBoundary.getDerivedStateFromError;
    WidgetErrorBoundary.getDerivedStateFromError = jest.fn().mockReturnValue({
      hasError: true,
      error: new Error(''),
    });

    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText('TestWidget failed to render')).toBeInTheDocument();

    // Restore original method
    WidgetErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
  });

  it('should handle different widget names', () => {
    render(
      <WidgetErrorBoundary widgetName="CustomWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('CustomWidget failed to render')).toBeInTheDocument();
  });

  it('should handle empty widget name', () => {
    render(
      <WidgetErrorBoundary widgetName="">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText(/failed to render/)).toBeInTheDocument();
  });

  it('should handle special characters in widget name', () => {
    render(
      <WidgetErrorBoundary widgetName="Widget-123 & Test">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget-123 & Test failed to render')).toBeInTheDocument();
  });

  it('should handle long error messages', () => {
    // Mock getDerivedStateFromError to return error with long message
    const originalGetDerivedStateFromError = WidgetErrorBoundary.getDerivedStateFromError;
    const longErrorMessage = 'A'.repeat(1000);
    WidgetErrorBoundary.getDerivedStateFromError = jest.fn().mockReturnValue({
      hasError: true,
      error: new Error(longErrorMessage),
    });

    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText(longErrorMessage)).toBeInTheDocument();

    // Restore original method
    WidgetErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
  });

  it('should handle error with non-Error objects', () => {
    // Mock getDerivedStateFromError to return non-Error object
    const originalGetDerivedStateFromError = WidgetErrorBoundary.getDerivedStateFromError;
    WidgetErrorBoundary.getDerivedStateFromError = jest.fn().mockReturnValue({
      hasError: true,
      error: { message: 'Custom error object' },
    });

    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText('TestWidget failed to render')).toBeInTheDocument();

    // Restore original method
    WidgetErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
  });

  it('should handle error with object without message property', () => {
    // Mock getDerivedStateFromError to return object without message
    const originalGetDerivedStateFromError = WidgetErrorBoundary.getDerivedStateFromError;
    WidgetErrorBoundary.getDerivedStateFromError = jest.fn().mockReturnValue({
      hasError: true,
      error: { customProperty: 'test' },
    });

    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <ThrowError shouldThrow={true} />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText('TestWidget failed to render')).toBeInTheDocument();

    // Restore original method
    WidgetErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
  });

  it('should handle multiple children', () => {
    render(
      <WidgetErrorBoundary widgetName="TestWidget">
        <div>Child 1</div>
        <div>Child 2</div>
        <NormalComponent />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should handle nested error boundaries', () => {
    render(
      <WidgetErrorBoundary widgetName="OuterWidget">
        <WidgetErrorBoundary widgetName="InnerWidget">
          <ThrowError shouldThrow={true} />
        </WidgetErrorBoundary>
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('InnerWidget failed to render')).toBeInTheDocument();
  });
}); 