'use client';

import { useRef, useCallback } from 'react';

type UsePrintableOptions = {
  /**
   * Custom ID for the printable content element
   * @default "printable-content"
   */
  printableId?: string;
};

export function usePrintable(options: UsePrintableOptions = {}) {
  const { printableId = 'printable-content' } = options;
  const contentRef = useRef<HTMLDivElement>(null);

  const print = useCallback(() => {
    // Create a temporary container for print content
    const printContainer = document.createElement('div');
    printContainer.id = printableId;
    printContainer.innerHTML = contentRef.current?.innerHTML || '';
    printContainer.style.cssText = `
      position: relative;
      z-index: 9999;
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 9998;
    `;

    // Create and append print styles
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #${printableId},
        #${printableId} * {
          visibility: visible;
        }
        #${printableId} {
          position: absolute;
          left: 0;
          top: 0;
        }
      }
    `;

    // Store original elements
    const originalPrintContainer = document.getElementById(printableId);

    // Append temporary elements
    document.head.appendChild(styleSheet);
    document.body.appendChild(overlay);
    document.body.appendChild(printContainer);

    // Hide original content during print
    if (originalPrintContainer) {
      originalPrintContainer.style.display = 'none';
    }

    // Print and cleanup
    window.print();

    // Cleanup after print dialog closes
    styleSheet.remove();
    overlay.remove();
    printContainer.remove();
    if (originalPrintContainer) {
      originalPrintContainer.style.display = '';
    }
  }, [printableId]);

  return { contentRef, print };
}
