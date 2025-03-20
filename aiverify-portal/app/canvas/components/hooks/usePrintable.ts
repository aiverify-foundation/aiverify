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

    // Clone the content instead of just copying innerHTML to preserve structure
    if (contentRef.current) {
      // Get all page elements
      const pageElements = contentRef.current.querySelectorAll(
        '.standard-report-page'
      );

      // Create a properly formatted print version for each page
      pageElements.forEach((pageElement, index) => {
        const pageClone = pageElement.cloneNode(true) as HTMLElement;

        // Set page break after each page except the last one
        if (index < pageElements.length - 1) {
          pageClone.style.pageBreakAfter = 'always';
          pageClone.style.breakAfter = 'page';
        }

        // Remove elements that shouldn't be printed
        pageClone.querySelectorAll('.print\\:hidden').forEach((el) => {
          el.remove();
        });

        // Reset transform styles that might be applied by the grid layout
        const transformElements = pageClone.querySelectorAll(
          '[style*="transform"]'
        );
        transformElements.forEach((el) => {
          // We want to preserve position but remove scaling/rotation transforms
          const element = el as HTMLElement;
          if (element.style.transform) {
            // Extract translate values if they exist but remove scaling/rotation
            const translateMatch =
              element.style.transform.match(/translate\([^)]+\)/);
            if (translateMatch) {
              element.style.transform = translateMatch[0];
            } else {
              element.style.transform = '';
            }
          }
        });

        // Ensure grid items are properly positioned and sized for printing
        const gridItems = pageClone.querySelectorAll('.react-grid-item');
        gridItems.forEach((item) => {
          const gridItem = item as HTMLElement;
          // Make sure items are visible and properly positioned
          gridItem.style.position = 'relative';
          gridItem.style.visibility = 'visible';
        });

        printContainer.appendChild(pageClone);
      });
    } else {
      // Fallback if contentRef not available
      printContainer.innerHTML = '';
    }

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
        .standard-report-page {
          page-break-after: always;
          break-after: page;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }
        .standard-report-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        /* Hide overflow page indicators in print */
        .text-gray-200 {
          display: none;
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
    setTimeout(() => {
      window.print();

      // Cleanup after print dialog closes
      styleSheet.remove();
      overlay.remove();
      printContainer.remove();
      if (originalPrintContainer) {
        originalPrintContainer.style.display = '';
      }
    }, 200); // Small delay to ensure DOM is updated
  }, [printableId]);

  return { contentRef, print };
}
