'use client';

import { useRef, useCallback } from 'react';
import { A4_MARGIN } from '../dimensionsConstants';

// Constants for page dimensions (A4)
const A4_HEIGHT_PX = 1100; // Typical A4 height in pixels at 96 DPI
const BOUNDARY_DETECTION_BUFFER = 40; // Buffer for boundary detection
const LAST_PAGE_BUFFER = 5; // Smaller buffer for the last page to avoid unnecessary compensation

// Helper function to calculate actual content height (including all children)
function getActualContentHeight(element: HTMLElement): number {
  // Try to get actual rendered height first using getBoundingClientRect
  if (element.getBoundingClientRect) {
    try {
      const rect = element.getBoundingClientRect();
      if (rect.height > 0) {
        return rect.height;
      }
    } catch (e) {
      console.warn('Error getting actual content height:', e);
      // Fallback to other methods if getBoundingClientRect fails
    }
  }

  // Try to get scrollHeight as backup
  if (element.scrollHeight > 0) {
    return element.scrollHeight;
  }

  // Fall back to offsetHeight if available
  if (element.offsetHeight > 0) {
    return element.offsetHeight;
  }

  // Last resort: style height
  return parseInt(element.style.height || '0', 10);
}

// Helper function to check if any visual elements within a widget are near the page boundary
function hasVisualElementsNearBoundary(
  parentElement: HTMLElement,
  parentYPos: number,
  isLastPage = false
): boolean {
  // Use a smaller buffer for the last page to avoid unnecessary compensation
  const bufferToUse = isLastPage ? LAST_PAGE_BUFFER : BOUNDARY_DETECTION_BUFFER;

  // Find all visual elements within the parent
  const visualElements = [
    ...Array.from(parentElement.querySelectorAll('svg, canvas')),
    ...Array.from(parentElement.querySelectorAll('img[src]')),
    ...Array.from(parentElement.querySelectorAll('table')),
  ];

  if (visualElements.length === 0) {
    return false; // No visual elements found
  }

  // Check each visual element's position relative to the page
  for (const element of visualElements) {
    // Skip elements with no height
    if (!(element instanceof HTMLElement)) continue;

    try {
      // Try to get position of element relative to parent
      let offsetTop = 0;
      let currentElement: HTMLElement | null = element as HTMLElement;

      // Walk up the DOM to find the relative position within the parent
      while (
        currentElement &&
        currentElement !== parentElement &&
        currentElement.offsetParent
      ) {
        offsetTop += currentElement.offsetTop;
        currentElement = currentElement.offsetParent as HTMLElement;
      }

      // Calculate element's position on the page
      const absoluteYPos = parentYPos + offsetTop;
      const elementHeight = getActualContentHeight(element as HTMLElement);
      const bottomPosition = absoluteYPos + elementHeight;

      // For the last page, only consider it if it's very close to the boundary
      if (isLastPage) {
        // On the last page, only detect if it actually crosses the boundary
        // with a minimal buffer to avoid triggering compensation unnecessarily
        if (bottomPosition > A4_HEIGHT_PX) {
          return true;
        }
      } else {
        // For non-last pages, use the standard detection logic
        if (
          bottomPosition > A4_HEIGHT_PX ||
          (bottomPosition > A4_HEIGHT_PX - bufferToUse &&
            bottomPosition <= A4_HEIGHT_PX)
        ) {
          return true; // Found a visual element near the boundary
        }
      }
    } catch (e) {
      console.warn('Error determining visual element position:', e);
      // If we can't determine position, be conservative
      // But still respect the isLastPage flag
      return !isLastPage;
    }
  }

  return false; // No visual elements near boundary
}

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
      const contentClone = contentRef.current.cloneNode(true) as HTMLElement;

      // Get all page elements directly from the original content (more reliable)
      const pageElements = contentRef.current.querySelectorAll(
        '.standard-report-page'
      );

      // Track pages that need compensation spaces due to large widgets being shifted
      const compensationNeeded: Record<number, boolean> = {};

      // First pass: Identify widgets that will need to be shifted and mark pages needing compensation
      pageElements.forEach((pageElement, pageIndex) => {
        const gridItems = pageElement.querySelectorAll('.react-grid-item');

        // Track key metrics for this page
        let hasGraphsOrTables = false;

        gridItems.forEach((gridItem) => {
          const element = gridItem as HTMLElement;

          // Extract positioning directly from transform styles
          let yPos = 0;
          const transform = element.style.transform;
          if (transform) {
            const translateMatch = transform.match(
              /translate\((\d+)px,\s*(\d+)px\)/
            );
            if (translateMatch) {
              yPos = parseInt(translateMatch[2], 10);
            }
          }

          // Get dimensions
          const height = getActualContentHeight(element);

          // Determine boundary conditions
          const bottomPosition = yPos + height;

          // Check if element crosses or is very near page boundary
          const isCrossingBoundary = bottomPosition > A4_HEIGHT_PX;
          const isNearBoundary =
            bottomPosition > A4_HEIGHT_PX - BOUNDARY_DETECTION_BUFFER &&
            bottomPosition <= A4_HEIGHT_PX;

          // Check content type - identify high-value content
          let hasGraphs = false;

          // More reliable way to check for actual images with real URLs
          const innerHTML = element.innerHTML || '';
          // Only consider actual image tags with http or https URLs
          const hasImgWithSrc =
            /<img[^>]+src=(['"])(https?:\/\/[^'"]+)\1[^>]*>/i.test(innerHTML);
          const hasCanvas = element.querySelectorAll('canvas').length > 0;
          const hasSvg = element.querySelectorAll('svg').length > 0;

          hasGraphs = hasCanvas || hasSvg || hasImgWithSrc;

          const isTable = element.querySelectorAll('table').length > 0;
          const isHighValueWidget = hasGraphs || isTable;

          if (isHighValueWidget) {
            hasGraphsOrTables = true;
          }

          // Size classification - more balanced thresholds
          const isLargeWidget = height > 300;
          const isMediumWidget = height > 200 && height <= 300;

          // ADD COMPENSATION IN THESE KEY SCENARIOS:

          // 1. Large high-value widgets (graphs/tables) crossing the boundary
          if (isCrossingBoundary && isHighValueWidget && isLargeWidget) {
            compensationNeeded[pageIndex + 1] = true;
          }

          // 2. Medium-sized high-value widgets very near the boundary (likely to shift)
          else if (isNearBoundary && isHighValueWidget && isMediumWidget) {
            compensationNeeded[pageIndex + 1] = true;
          }
        });

        // 4. Only add compensation for pages with visual elements (graphs/charts/images) near page boundaries
        // This is more precise than the previous approach and ignores text content near boundaries
        if (hasGraphsOrTables) {
          // Check if any VISUAL ELEMENT is in the bottom zone (near page boundary)
          const hasVisualElementsNearBottom = Array.from(gridItems).some(
            (item) => {
              const element = item as HTMLElement;

              // Skip this item if it doesn't contain visual elements
              const hasVisualContent =
                element.querySelectorAll('svg, canvas').length > 0 ||
                /<img[^>]+src=(['"])(https?:\/\/[^'"]+)\1[^>]*>/i.test(
                  element.innerHTML || ''
                );

              if (!hasVisualContent) {
                return false; // Skip text-only widgets
              }

              // Now check position for visual elements
              let yPos = 0;
              const transform = element.style.transform;
              if (transform) {
                const translateMatch = transform.match(
                  /translate\((\d+)px,\s*(\d+)px\)/
                );
                if (translateMatch) {
                  yPos = parseInt(translateMatch[2], 10);
                }
              }

              // Use the helper function to check the actual positions of visual elements
              return hasVisualElementsNearBoundary(
                element,
                yPos,
                pageIndex === pageElements.length - 1
              );
            }
          );

          // Only add compensation if:
          // 1. Visual elements are near the bottom AND
          // 2. This is not the last page of the document
          const isLastPage = pageIndex === pageElements.length - 1;
          const totalPages = pageElements.length;
          const isLastPageOfDocument = isLastPage;

          // Only add compensation when absolutely necessary
          // - Must have visual elements near boundary
          // - Must not be the last page of the document
          if (hasVisualElementsNearBottom && !isLastPageOfDocument) {
            compensationNeeded[pageIndex + 1] = true;
          }
        }
      });

      // Use innerHTML approach for copying the content
      printContainer.innerHTML = contentRef.current.innerHTML;

      // Process print:hidden elements to remove them
      printContainer.querySelectorAll('.print\\:hidden').forEach((el) => {
        el.remove();
      });

      // Get all pages in the copied content
      const pages = printContainer.querySelectorAll('.standard-report-page');
      let insertedCompensationPages = 0;

      // Apply original page break settings and add compensation pages
      pages.forEach((page, index) => {
        const adjustedIndex = index + insertedCompensationPages;
        const isLastPage = index === pages.length - 1;
        const needsCompensation = compensationNeeded[index];

        // Add page break after each page except the last one
        if (!isLastPage) {
          (page as HTMLElement).style.pageBreakAfter = 'always';
          (page as HTMLElement).style.breakAfter = 'page';
        } else {
          // Special handling for last page
          (page as HTMLElement).style.pageBreakAfter = 'avoid';
          (page as HTMLElement).style.breakAfter = 'avoid';
          (page as HTMLElement).setAttribute('data-last-page', 'true');
        }

        // If compensation is needed, insert a compensation page after the current page
        if (needsCompensation && !isLastPage) {
          // Create a compensation spacer with minimal styling
          const compensationPage = document.createElement('div');
          compensationPage.classList.add('compensation-page');

          // Minimal size compensation - just enough for graph repositioning
          compensationPage.style.height = '3mm'; // Smaller space, just for graphs
          compensationPage.style.maxWidth = '210mm'; // A4 width
          compensationPage.style.width = '100%';
          compensationPage.style.margin = '0 auto';
          compensationPage.style.pageBreakAfter = 'always !important';
          compensationPage.style.breakAfter = 'page !important';
          compensationPage.style.position = 'relative';
          compensationPage.style.overflow = 'hidden';

          // Ultra-subtle indicator that won't be visible in print
          const indicator = document.createElement('div');
          indicator.textContent = `Graph spacing`;
          indicator.style.position = 'absolute';
          indicator.style.top = '50%';
          indicator.style.left = '50%';
          indicator.style.transform = 'translate(-50%, -50%)';
          indicator.style.color = '#f9f9f9'; // Nearly invisible
          indicator.style.fontSize = '6px';
          indicator.style.textAlign = 'center';
          indicator.style.width = '100%';
          indicator.classList.add('print:invisible');

          compensationPage.appendChild(indicator);

          // Insert the compensation page after the current page
          page.after(compensationPage);

          // Increment counter for inserted pages
          insertedCompensationPages++;
        }
      });
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
        #${printableId} {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          page-break-after: avoid;
          break-after: avoid;
          overflow: visible !important;
          box-sizing: border-box;
        }
        
        /* Page styling - standard grid pages */
        .standard-report-page {
          box-shadow: none;
          box-sizing: border-box;
          overflow: visible !important;
          position: relative !important;
          /* Keep original padding for grid pages */
          margin: 0 auto !important;
          max-width: 210mm; /* A4 width */
          width: 100%;
          display: block;
        }
        
        /* Compensation page styling - apply consistent margins */
        .compensation-page {
          box-shadow: none;
          box-sizing: border-box;
          position: relative !important;
          padding: ${A4_MARGIN}px !important; /* Apply A4_MARGIN to compensation pages */
          margin: 0 auto !important;
          display: block !important;
          page-break-before: always !important;
          page-break-after: always !important;
          break-before: page !important;
          break-after: page !important;
          height: auto !important; /* Allow height based on content */
          min-height: 3mm !important;
          max-width: 210mm; /* A4 width */
          width: 100%;
        }
      
        /* Page break settings */
        .standard-report-page:not(:last-child) {
          page-break-after: always;
          break-after: page;
        }
        
        .standard-report-page:last-child {
          page-break-after: avoid;
          break-after: avoid;
          margin-bottom: 0 !important;
        }
        
        /* A4 page size - use consistent margin for all pages */
        @page {
          margin: ${A4_MARGIN}px !important; /* Apply A4_MARGIN to @page */
          padding: 0;
          size: 210mm 297mm;
        }
        
        /* Basic body styling */
        html, body {
          height: auto !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Grid item styling */
        .react-grid-item {
          overflow: visible !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Grid item content styling */
        .grid-item-root {
          overflow: visible !important;
          height: 100% !important;
          width: 100% !important;
          position: relative !important;
        }
        
        /* Visual elements */
        img, svg, canvas, table {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          max-width: 100% !important;
        }
        
        /* Tables */
        table {
          width: 100% !important;
          table-layout: fixed !important;
        }
        
        /* Text elements */
        p, h1, h2, h3, h4, h5, h6, span, div {
          overflow: visible !important;
          text-overflow: clip !important;
          word-break: break-word !important;
          white-space: normal !important;
        }
        
        /* Hide print:invisible elements */
        .print\\:invisible, .print\\:hidden {
          display: none !important;
          visibility: hidden !important;
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
