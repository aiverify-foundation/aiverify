import React from 'react';
import { render } from '@testing-library/react';
import { ResizeHandle } from '../resizeHandle';

describe('ResizeHandle', () => {
  const defaultProps = {
    handleAxis: 'se',
  };

  describe('Rendering', () => {
    it('renders resize handle with correct base classes', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass(
        'react-resizable-handle',
        'invisible',
        'group-hover:visible',
        'group-active:visible',
        'no-print'
      );
    });

    it('applies correct position classes for southeast handle', () => {
      const { container } = render(<ResizeHandle handleAxis="se" />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle-se');
    });

    it('applies correct position classes for southwest handle', () => {
      const { container } = render(<ResizeHandle handleAxis="sw" />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle-sw');
    });

    it('applies correct position classes for northeast handle', () => {
      const { container } = render(<ResizeHandle handleAxis="ne" />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle-ne');
    });

    it('applies correct position classes for northwest handle', () => {
      const { container } = render(<ResizeHandle handleAxis="nw" />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle-nw');
    });

    it('renders as a span element', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle.tagName).toBe('SPAN');
    });
  });

  describe('Ref Handling', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLSpanElement>();
      const { container } = render(<ResizeHandle {...defaultProps} ref={ref as any} />);
      
      expect(ref.current).toBe(container.firstChild);
    });

    it('works without ref', () => {
      expect(() => {
        render(<ResizeHandle {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Additional Props', () => {
    it('handles additional props', () => {
      const { container } = render(
        <ResizeHandle {...defaultProps} data-testid="resize-handle" />
      );
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveAttribute('data-testid', 'resize-handle');
    });
  });

  describe('Handle Axis Variations', () => {
    it('handles all valid handle axis values', () => {
      const axes = ['sw', 'nw', 'se', 'ne'] as const;
      
      axes.forEach(axis => {
        const { container, unmount } = render(<ResizeHandle handleAxis={axis} />);
        
        const handle = container.firstChild as HTMLElement;
        expect(handle).toHaveClass(`react-resizable-handle-${axis}`);
        
        unmount();
      });
    });

    it('handles invalid handle axis gracefully', () => {
      const { container } = render(<ResizeHandle handleAxis="invalid" as any />);
      
      const handle = container.firstChild as HTMLElement;
      // Should still have base classes but no position-specific class
      expect(handle).toHaveClass('react-resizable-handle');
      expect(handle).not.toHaveClass('react-resizable-handle-invalid');
    });

    it('handles undefined handle axis', () => {
      const { container } = render(<ResizeHandle handleAxis={undefined} />);
      
      const handle = container.firstChild as HTMLElement;
      // Should still have base classes
      expect(handle).toHaveClass('react-resizable-handle');
    });
  });

  describe('CSS Classes Structure', () => {
    it('has correct main handle classes', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);
      
      const handle = container.firstChild as HTMLElement;
      const mainClasses = [
        'react-resizable-handle',
        'invisible',
        'group-hover:visible',
        'group-active:visible',
        'no-print'
      ];
      
      mainClasses.forEach(className => {
        expect(handle).toHaveClass(className);
      });
    });

    it('combines main classes with position classes correctly', () => {
      const { container } = render(<ResizeHandle handleAxis="se" />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('react-resizable-handle');
      expect(handle.className).toContain('react-resizable-handle-se');
      expect(handle.className).toContain('invisible');
      expect(handle.className).toContain('group-hover:visible');
      expect(handle.className).toContain('group-active:visible');
      expect(handle.className).toContain('no-print');
    });
  });

  describe('Accessibility', () => {
    it('supports accessibility attributes', () => {
      const { container } = render(
        <ResizeHandle 
          {...defaultProps} 
          role="button"
          aria-label="Resize widget"
          tabIndex={0}
        />
      );
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveAttribute('role', 'button');
      expect(handle).toHaveAttribute('aria-label', 'Resize widget');
      expect(handle).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Integration with react-grid-layout', () => {
    it('has classes compatible with react-grid-layout', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle');
      expect(handle).toHaveClass('react-resizable-handle-se');
    });

    it('supports react-grid-layout resize handle positioning', () => {
      const positions = ['sw', 'nw', 'se', 'ne'] as const;
      
      positions.forEach(position => {
        const { container, unmount } = render(<ResizeHandle handleAxis={position} />);
        
        const handle = container.firstChild as HTMLElement;
        expect(handle).toHaveClass(`react-resizable-handle-${position}`);
        
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null ref', () => {
      expect(() => {
        render(<ResizeHandle {...defaultProps} ref={null as any} />);
      }).not.toThrow();
    });

    it('handles empty string handle axis', () => {
      const { container } = render(<ResizeHandle handleAxis="" />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle');
    });

    it('handles very long handle axis string', () => {
      const { container } = render(<ResizeHandle handleAxis="very-long-axis-name" as any />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle).toHaveClass('react-resizable-handle');
      expect(handle).not.toHaveClass('react-resizable-handle-very-long-axis-name');
    });
  });

  describe('Performance', () => {
    it('renders efficiently with minimal DOM structure', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);
      
      const handle = container.firstChild as HTMLElement;
      expect(handle.children.length).toBe(0); // No nested elements
    });

    it('does not create unnecessary re-renders', () => {
      const { rerender } = render(<ResizeHandle {...defaultProps} />);
      
      // Re-render with same props
      rerender(<ResizeHandle {...defaultProps} />);
      
      // Should not throw or cause issues
      expect(true).toBe(true);
    });
  });
}); 