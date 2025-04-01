'use client';

import { useRef, useCallback } from 'react';

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

    // Clone the content instead of just copying innerHTML to preserve structure
    if (contentRef.current) {
      // Get all page elements
      const pageElements = contentRef.current.querySelectorAll(
        '.standard-report-page'
      );

      // Total number of pages for better control
      const totalPages = pageElements.length;

      // Create a properly formatted print version for each page
      pageElements.forEach((pageElement, index) => {
        const pageClone = pageElement.cloneNode(true) as HTMLElement;
        const isLastPage = index === pageElements.length - 1;

        // Set page break after each page except the last one
        if (!isLastPage) {
          pageClone.style.pageBreakAfter = 'always';
          pageClone.style.breakAfter = 'page';
        } else {
          // Extra strict settings for the last page
          pageClone.style.pageBreakAfter = 'avoid';
          pageClone.style.breakAfter = 'avoid';
          pageClone.style.marginBottom = '0';
          pageClone.setAttribute('data-last-page', 'true');
        }

        // Apply proper margin to each page for printing
        pageClone.style.margin = '0';
        pageClone.style.maxWidth = '210mm'; // A4 width
        pageClone.style.width = '100%';
        pageClone.style.marginLeft = 'auto';
        pageClone.style.marginRight = 'auto';
        pageClone.style.boxSizing = 'border-box';
        pageClone.style.position = 'relative'; // Ensure the page has relative positioning
        pageClone.style.pageBreakInside = 'avoid'; // Prevent page from breaking inside

        // Remove elements that shouldn't be printed
        pageClone.querySelectorAll('.print\\:hidden').forEach((el) => {
          el.remove();
        });

        // Find all react-grid-items and ensure they have correct positioning
        const gridItems = pageClone.querySelectorAll('.react-grid-item');

        // Create a parent container for grid items with absolute positioning
        const gridContainer = document.createElement('div');
        gridContainer.style.position = 'absolute';
        gridContainer.style.top = '0';
        gridContainer.style.left = '0';
        gridContainer.style.right = '0';
        gridContainer.style.width = '100%';
        gridContainer.style.height = '100%';
        gridContainer.style.pageBreakInside = 'avoid'; // Prevent container from breaking across pages
        gridContainer.style.breakInside = 'avoid';
        gridContainer.style.boxSizing = 'border-box';
        gridContainer.style.padding = '0 15px'; // Add consistent horizontal padding to center content

        // Sort grid items by y-coordinate to ensure proper ordering
        const sortedGridItems = Array.from(gridItems)
          .map((item) => {
            const gridItem = item as HTMLElement;
            // Extract y position from transform or data attribute
            let yPos = 0;
            let xPos = 0;

            // Extract coordinates from transform
            const transform = gridItem.style.transform;
            if (transform) {
              const translateMatch = transform.match(
                /translate\((\d+)px,\s*(\d+)px\)/
              );
              if (translateMatch) {
                xPos = parseInt(translateMatch[1], 10);
                yPos = parseInt(translateMatch[2], 10);
              }
            }

            return {
              element: gridItem,
              yPos,
              xPos,
              width: parseInt(gridItem.style.width || '0', 10),
              height: parseInt(gridItem.style.height || '0', 10),
            };
          })
          .sort((a, b) => a.yPos - b.yPos);

        // Process grid items in order from top to bottom
        sortedGridItems.forEach(
          ({ element: gridItem, xPos, yPos, width, height }) => {
            // Clone the grid item to modify without affecting page structure
            const itemClone = gridItem.cloneNode(true) as HTMLElement;

            // Get margin to adjust positioning (15px from container padding)
            const horizontalMargin = 15;

            // Replace transform with absolute positioning, adjusting for horizontal margin
            itemClone.style.transform = '';
            itemClone.style.position = 'absolute';
            itemClone.style.top = `${yPos}px`;

            // Add margin on the left side only to match designer view
            itemClone.style.left = `${xPos + horizontalMargin}px`;

            itemClone.style.width = `${width}px`;
            itemClone.style.height = `${height}px`;

            // Ensure visibility and proper content flow
            itemClone.style.visibility = 'visible';
            itemClone.style.overflow = 'visible';
            itemClone.style.pageBreakInside = 'avoid !important';
            itemClone.style.breakInside = 'avoid !important';
            itemClone.style.margin = '0'; // Remove any margins that could cause shifts
            itemClone.style.padding = '0'; // Normalize padding

            // Process the grid item root content
            const gridItemRoot = itemClone.querySelector(
              '.grid-item-root'
            ) as HTMLElement;
            if (gridItemRoot) {
              gridItemRoot.style.overflow = 'visible';
              gridItemRoot.style.height = '100%';
              gridItemRoot.style.width = '100%';
              gridItemRoot.style.position = 'relative';
              gridItemRoot.style.margin = '0';
              gridItemRoot.style.padding = '0';
            }

            // Process text elements
            itemClone
              .querySelectorAll(
                'p, h1, h2, h3, h4, h5, h6, span, div, table, th, td'
              )
              .forEach((textEl) => {
                const el = textEl as HTMLElement;
                el.style.overflow = 'visible';
                el.style.textOverflow = 'clip';
                el.style.wordBreak = 'break-word';
                el.style.whiteSpace = 'normal';
              });

            // Process tables
            itemClone.querySelectorAll('table').forEach((table) => {
              const tableEl = table as HTMLElement;
              tableEl.style.width = '100%';
              tableEl.style.tableLayout = 'fixed';
              tableEl.style.pageBreakInside = 'avoid';
              tableEl.style.breakInside = 'avoid';
            });

            // Process images
            itemClone.querySelectorAll('img').forEach((img) => {
              const imgEl = img as HTMLElement;
              imgEl.style.maxWidth = '100%';
              imgEl.style.height = 'auto';
            });

            // Add the processed clone to our container
            gridContainer.appendChild(itemClone);

            // Remove the original item from the page
            if (gridItem.parentNode) {
              gridItem.parentNode.removeChild(gridItem);
            }
          }
        );

        // Add the grid container to the page
        pageClone.appendChild(gridContainer);

        // Add the processed page to the print container
        printContainer.appendChild(pageClone);

        // Add the page counter at the bottom (except for cover page)
        if (index > 0 || totalPages === 1) {
          const pageCounter = document.createElement('div');
          pageCounter.style.position = 'absolute';
          pageCounter.style.bottom = '15px';
          pageCounter.style.right = '30px'; // Increase right margin to match the padding
          pageCounter.style.fontSize = '10px';
          pageCounter.style.color = '#999999';
          pageCounter.textContent = `${index + 1} / ${totalPages}`;
          pageClone.appendChild(pageCounter);
        }
      });
    } else {
      // Fallback if contentRef not available
      printContainer.innerHTML = '';
    }

    // Create a strict container to prevent overflow
    const printWrapper = document.createElement('div');
    /*     printWrapper.setAttribute('data-print-wrapper', 'true');
    printWrapper.style.position = 'relative';
    printWrapper.style.overflow = 'hidden';
    printWrapper.style.pageBreakAfter = 'avoid';
    printWrapper.style.breakAfter = 'avoid'; */

    /*     // Critical: apply fixed dimensions to prevent extra pages
    printContainer.style.cssText = `
      position: relative;
      z-index: 9999;
      page-break-after: avoid;
      break-after: avoid;
      overflow: hidden;
    `; */

    // Add the container to the wrapper
    printWrapper.appendChild(printContainer);

    // Create overlay for print preview
    const overlay = document.createElement('div');
    /*     overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 9998;
    `; */

    // Create and append print styles with stronger rules
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
          width: 100%;
          page-break-after: avoid;
          break-after: avoid;
          overflow: hidden !important;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .standard-report-page {
          box-shadow: none;
          box-sizing: border-box;
          overflow: visible !important;
          position: relative !important;
          padding: 0;
          margin: 0 auto !important; /* Center the page horizontally */
          max-width: 210mm; /* A4 width */
          width: 100%;
          display: block;
        }
        
        /* Set fixed dimensions for A4 */
        @page {
          margin: 0;
          padding: 0;
          size: 210mm 297mm; /* Specific A4 dimensions */
        }
        
        /* To ensure page is centered */
        html, body {
          height: auto !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .standard-report-page:not(:last-child) {
          page-break-after: always;
          break-after: page;
        }
        .standard-report-page:last-child {
          page-break-after: avoid;
          break-after: avoid;
          margin-bottom: 0 !important;
        }
        /* Hide overflow page indicators in print */
        .text-gray-200 {
          display: none;
        }
        /* Ensure grid items are displayed exactly as in designer */
        .react-grid-item {
          overflow: visible !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Ensure grid item root content displays properly */
        .grid-item-root {
          overflow: visible !important;
          height: 100% !important;
          width: 100% !important;
          position: relative !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Ensure all content is visible */
        .react-grid-item * {
          overflow: visible !important;
          word-wrap: break-word !important;
        }
        /* Ensure tables print properly */
        table {
          width: 100% !important;
          table-layout: fixed !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        /* Handle images */
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        /* Force hiding any content after the last page */
        .standard-report-page:last-child ~ * {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        /* Prevent any extra content creation */
        [data-print-wrapper="true"]::after {
          content: none !important;
          display: none !important;
        }
      }
    `;

    // Store original elements
    const originalPrintContainer = document.getElementById(printableId);

    // Store original title
    const originalTitle = document.title;

    // Append temporary elements
    document.head.appendChild(styleSheet);
    document.body.appendChild(overlay);
    document.body.appendChild(printWrapper);

    // Hide original content during print
    if (originalPrintContainer) {
      originalPrintContainer.style.display = 'none';
    }

    // Print and cleanup
    setTimeout(() => {
      // Force recalculation and cleanup before printing
      document.body.style.display = 'block';

      // Trigger print
      window.print();

      // Cleanup after print dialog closes
      styleSheet.remove();
      overlay.remove();
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
    }, 200); // Small delay to ensure DOM is updated
  }, [printableId, filename]);

  return { contentRef, print };
}
