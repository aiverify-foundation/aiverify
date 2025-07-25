import { renderHook } from '@testing-library/react';
import { usePrintable } from '../usePrintable';

describe('usePrintable', () => {
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

  it('should handle print function existence', () => {
    const { result } = renderHook(() => usePrintable());

    expect(result.current.print).toBeDefined();
    expect(typeof result.current.print).toBe('function');
  });

  it('should handle custom filename option', () => {
    const customOptions = {
      filename: 'test-document.pdf',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle custom printableId option', () => {
    const customOptions = {
      printableId: 'custom-printable',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle contentRef existence', () => {
    const { result } = renderHook(() => usePrintable());

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.contentRef.current).toBe(null);
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

  it('should handle filename without .pdf extension', () => {
    const customOptions = {
      filename: 'test-document',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle empty filename', () => {
    const customOptions = {
      filename: '',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle whitespace filename', () => {
    const customOptions = {
      filename: '   ',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle existing printable container option', () => {
    const customOptions = {
      printableId: 'existing-container',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle no existing printable container option', () => {
    const customOptions = {
      printableId: 'non-existent-container',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle custom title element option', () => {
    const customOptions = {
      filename: 'custom-title.pdf',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle cleanup option', () => {
    const customOptions = {
      filename: 'cleanup-test.pdf',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });

  it('should handle title element cleanup option', () => {
    const customOptions = {
      filename: 'title-cleanup-test.pdf',
    };

    const { result } = renderHook(() => usePrintable(customOptions));

    expect(result.current.contentRef).toBeDefined();
    expect(result.current.print).toBeDefined();
  });
}); 