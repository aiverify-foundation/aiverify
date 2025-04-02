'use client';

import { useRef, useCallback } from 'react';

// Constants for page dimensions (A4)
const A4_HEIGHT_PX = 1122; // Typical A4 height in pixels at 96 DPI
const BOUNDARY_DETECTION_BUFFER = 40; // More reasonable buffer for boundary detection
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

    // Clone the content instead of just copying innerHTML to preserve structure
    if (contentRef.current) {
      // Get all page elements
      const pageElements = contentRef.current.querySelectorAll(
        '.standard-report-page'
      );

      // Track pages that need compensation spaces due to large widgets being shifted
      const compensationNeeded: Record<number, boolean> = {};

      // First pass: Identify widgets that will need to be shifted and mark pages needing compensation
      pageElements.forEach((pageElement, pageIndex) => {
        const gridItems = pageElement.querySelectorAll('.react-grid-item');

        // Track key metrics for this page
        let largestWidgetHeight = 0;
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
          largestWidgetHeight = Math.max(largestWidgetHeight, height);

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

          const isHighValueWidget = hasGraphs;

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

          // 3. Any extremely large widget (regardless of content) crossing boundary
          else if (isCrossingBoundary && height > A4_HEIGHT_PX * 0.45) {
            // >45% of page height
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
                element.querySelectorAll('svg, canvas, table').length > 0 ||
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

          // Safely get the total number of pages
          const totalPages =
            contentRef.current?.querySelectorAll('.standard-report-page')
              .length || 0;

          const isLastPageOfDocument =
            isLastPage &&
            (totalPages === pageIndex + 1 || pageIndex === totalPages - 1);

          // For debugging - add classes to help identify what's happening
          if (isLastPage) {
            pageElement.classList.add('is-last-page');
          }

          if (isLastPageOfDocument) {
            pageElement.classList.add('is-last-page-of-document');
          }

          // Only add compensation when absolutely necessary
          // - Must have visual elements near boundary
          // - Must not be the last page of the document
          if (hasVisualElementsNearBottom && !isLastPageOfDocument) {
            compensationNeeded[pageIndex + 1] = true;
          }
        }
      });

      // Create a properly formatted print version for each page
      pageElements.forEach((pageElement, index) => {
        const pageClone = pageElement.cloneNode(true) as HTMLElement;
        const isLastPage = index === pageElements.length - 1;
        const needsCompensation = compensationNeeded[index];

        // Page break controls - add forced page break if this page has compensated content
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

        // Add a data attribute to track if this page needs compensation
        if (needsCompensation) {
          pageClone.setAttribute('data-needs-compensation', 'true');
        }

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

            // Determine if this is a graph or table that should be kept intact
            let isGraph = false;

            // Use same regex approach for consistency with strict URL matching
            const itemInnerHTML = itemClone.innerHTML || '';
            const hasItemImgWithSrc =
              /<img[^>]+src=(['"])(https?:\/\/[^'"]+)\1[^>]*>/i.test(
                itemInnerHTML
              );
            const hasItemCanvas =
              itemClone.querySelectorAll('canvas').length > 0;
            const hasItemSvg = itemClone.querySelectorAll('svg').length > 0;

            isGraph = hasItemImgWithSrc || hasItemCanvas || hasItemSvg;

            const isTable = itemClone.querySelectorAll('table').length > 0;

            // Use actual DOM-measured height instead of style-based height
            const heightFromStyle = parseInt(itemClone.style.height || '0', 10);
            const actualHeight = getActualContentHeight(itemClone);
            const contentHeight = Math.max(heightFromStyle, actualHeight);

            // Adjust height if we found content taller than the style height
            if (actualHeight > heightFromStyle && heightFromStyle > 0) {
              itemClone.style.height = `${actualHeight}px`;
            }

            const isLargeWidget = contentHeight > 200; // Arbitrary threshold for "large" widgets

            // Apply different handling based on widget type
            if ((isGraph || isTable) && isLargeWidget) {
              // Mark this as a no-break widget that should be kept intact
              itemClone.classList.add('no-break-widget');
              itemClone.dataset.originalHeight = contentHeight.toString();
              itemClone.dataset.originalTop = yPos.toString();

              // Keep strict settings for graphs and tables
              itemClone.style.pageBreakInside = 'avoid !important';
              itemClone.style.breakInside = 'avoid !important';
            } else {
              // For other content, we can be more flexible about breaking
              itemClone.style.pageBreakInside = 'auto';
              itemClone.style.breakInside = 'auto';
            }

            // Ensure visibility and proper content flow
            itemClone.style.visibility = 'visible';
            itemClone.style.overflow = 'visible';
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

              // For tables, we apply a specialized approach
              if (isLargeWidget) {
                // Large tables should not break across pages
                tableEl.style.pageBreakInside = 'avoid';
                tableEl.style.breakInside = 'avoid';
              } else {
                // Smaller tables can potentially break if necessary
                tableEl.style.pageBreakInside = 'auto';
                tableEl.style.breakInside = 'auto';
              }
            });

            // Process images
            itemClone.querySelectorAll('img[src]').forEach((img) => {
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

        // Add a balanced version of compensation pages
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
          printContainer.appendChild(compensationPage);
        }
      });
    } else {
      // Fallback if contentRef not available
      printContainer.innerHTML = '';
    }

    // Create a strict container to prevent overflow
    const printWrapper = document.createElement('div');

    // Add the container to the wrapper
    printWrapper.appendChild(printContainer);

    // Create overlay for print preview
    const overlay = document.createElement('div');

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
        
        /* Compensation page styling - micro size for graph spacing only */
        .compensation-page {
          box-shadow: none;
          box-sizing: border-box;
          position: relative !important;
          padding: 0;
          margin: 0 auto !important;
          display: block !important;
          page-break-before: always !important;
          page-break-after: always !important;
          break-before: page !important;
          break-after: page !important;
          height: 3mm !important; /* Minimal graph spacing */
          min-height: 3mm !important;
          max-height: 3mm !important;
        }
      
        
        /* Additional rules to help with proper page breaks */
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
        
        /* Ensure all visual elements don't break across pages */
        img, svg, canvas, table {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Specific handling for different widget types */
        .no-break-widget {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Allow other widgets to potentially break if needed */
        .react-grid-item:not(.no-break-widget) {
          page-break-inside: auto;
          break-inside: auto;
        }
        
        /* Ensure grid items are displayed exactly as in designer */
        .react-grid-item {
          overflow: visible !important;
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
        
        
        @media print {
          .print\\:invisible {
            display: none !important;
            visibility: hidden !important;
          }
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
