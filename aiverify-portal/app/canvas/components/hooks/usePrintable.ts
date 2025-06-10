'use client';

import { useRef, useCallback } from 'react';

// Constants for page dimensions (A4)
const A4_HEIGHT_PX = 1100; // Typical A4 height in pixels at 96 DPI
const BOUNDARY_DETECTION_BUFFER = 6; // Buffer for boundary detection

type UsePrintableOptions = {
  /**
   * Custom ID for the printable content element
   * @default "printable-content"
   */
  printableId?: string;

  /**
   * Custom filename for the PDF
   * @default "document.pdf"
   */
  filename?: string;
};

export function usePrintable(options: UsePrintableOptions = {}) {
  const { printableId = 'printable-content', filename = 'document.pdf' } =
    options;
  const contentRef = useRef<HTMLDivElement>(null);

  const print = useCallback(() => {
    // Create a temporary container for print content
    const printContainer = document.createElement('div');
    printContainer.id = printableId;

    // Set the filename for the PDF
    if (filename && filename.trim() !== '') {
      // Create a title element which browsers use for the default filename
      const titleElement = document.createElement('title');
      titleElement.textContent = filename.endsWith('.pdf')
        ? filename
        : `${filename}.pdf`;
      document.head.appendChild(titleElement);

      // Store the original title to restore it later
      document.title = titleElement.textContent;
    }

    if (contentRef.current) {
      // Clone the content to avoid modifying the original - but use node cloning instead of innerHTML

      // Use innerHTML approach for copying the content
      printContainer.innerHTML = contentRef.current.innerHTML;

      // Get all page elements from the copied content and apply print styles
      const pageElements = printContainer.querySelectorAll(
        '.standard-report-page'
      );

      pageElements.forEach((pageElement, pageIndex) => {
        const page = pageElement as HTMLElement;
        page.style.display = 'block'
        page.style.height = 'auto'
        page.style.width = '740px'
        page.style.padding = '0px'
        page.style.margin = '0'
        page.style.position = 'relative'
        page.style.overflow = 'hidden'
        page.style.marginLeft = 'auto'
        page.style.marginRight = 'auto'
        page.style.pageBreakAfter = 'avoid'
        page.style.pageBreakBefore = 'avoid'

        const gridLayout = pageElement.querySelector('.react-grid-layout');
        if (gridLayout) {
          const gridItems = gridLayout.querySelectorAll('.react-grid-item');
          
          // Extract positions and sort grid items by visual position
          const itemsWithPositions = Array.from(gridItems).map((gridItem) => {
            const element = gridItem as HTMLElement;
            
            // Extract position from CSS transform
            let x = 0, y = 0;
            const transform = element.style.transform;
            if (transform) {
              const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
              if (translateMatch) {
                x = parseFloat(translateMatch[1]) || 0;
                y = parseFloat(translateMatch[2]) || 0;
              }
            }
            
            return { element, x, y };
          });
          
          // Sort by y-coordinate first (top to bottom), then by x-coordinate (left to right)
          itemsWithPositions.sort((a, b) => {
            if (Math.abs(a.y - b.y) < 5) { // Items on same row
              return a.x - b.x;
            }
            return a.y - b.y;
          });
          
          // Reorder elements in the DOM by removing and re-appending in correct order
          itemsWithPositions.forEach(({ element }) => {
            gridLayout.appendChild(element);
          });
          
          // Now apply print styles to the reordered items
          gridItems.forEach((gridItem) => {
            const element = gridItem as HTMLElement;
            element.style.height = '100%'
            element.style.position = 'relative'
            element.style.padding = '0'
            element.style.margin = '0'
            element.style.width = "100%"
            element.style.overflowX = 'hidden'
            element.style.overflowY = 'visible'
            element.style.display = 'block'
            element.style.transform = ''

            const items = element.querySelectorAll<HTMLElement>('[style*="height: 100vh"]');
            items.forEach((item) => {
              item.style.height = '1076px'
            });
          });
        }

        const gridLayouts = pageElement.querySelectorAll('.react-grid-layout');
        gridLayouts.forEach((gridLayout) => {
          const element = gridLayout as HTMLElement;
          element.style.height = 'auto'
          element.style.position = 'relative'
          element.style.padding = '0'
          element.style.margin = '0'
          element.style.marginLeft = 'auto'
          element.style.marginRight = '0px'
          element.style.width = "100%"
          element.style.overflowX = 'hidden'
          element.style.overflowY = 'hidden'
          element.style.display = 'block'
          element.style.pageBreakAfter = 'avoid'
          element.style.pageBreakBefore = 'avoid'
        })
      })
    } else {
      // Fallback if contentRef not available
      printContainer.innerHTML = '';
    }

    // Create a wrapper for the print container
    const printWrapper = document.createElement('div');
    printWrapper.appendChild(printContainer);

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

        .no-print, .no-print *
        {
            display: none !important;
        }

        #${printableId} {
          position: relative;
          width: 740px;
          height: auto;
          padding: 0 !important;
          /* margin: 0 !important; */
          margin-left: 2px;
          margin-right: 0px; 
          overflow: visible !important;
          box-sizing: border-box;
        }
        
        /* A4 page size */
        @page {
          margin: 0px !important;
          size: 200mm 297mm; 
        }
        
        /* Basic body styling */
        html, body {
          height: auto !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 750px !important;
        }
        
        /* Visual elements */
        img, svg, canvas {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          max-width: 740px !important;
        }
        
        /* Tables */
        table {
          width: 700px !important;
          table-layout: fixed !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Text elements */
        p, h1, h2, h3, h4, h5, h6, span, div {
          overflow: visible !important;
          text-overflow: clip !important;
          word-break: break-word !important;
          white-space: normal !important;
          max-width: 740px !important;
        }
      }
    `;

    // Store original elements and title
    const originalPrintContainer = document.getElementById(printableId);
    const originalTitle = document.title;

    // Append temporary elements
    document.head.appendChild(styleSheet);
    document.body.appendChild(printWrapper);

    // Hide original content during print
    if (originalPrintContainer) {
      originalPrintContainer.style.display = 'none';
    }

    // Print and cleanup
    setTimeout(() => {
      // Trigger print
      window.print();

      // Cleanup after print dialog closes
      setTimeout(() => {
        styleSheet.remove();
        printWrapper.remove();

        // Restore original document title
        document.title = originalTitle;

        // Remove the title element we added
        const addedTitleElement = document.querySelector('title:not([id])');
        if (addedTitleElement) {
          addedTitleElement.remove();
        }

        if (originalPrintContainer) {
          originalPrintContainer.style.display = '';
        }
      }, 100);
    }, 200); // Small delay to ensure DOM is updated
  }, [printableId, filename]);

  return { contentRef, print };
}
