import { Layout } from 'react-grid-layout';
import {
  GRID_HEIGHT,
  GRID_ROW_HEIGHT,
} from '@/app/canvas/components/dimensionsConstants';
import { gridItemRootClassName } from '@/app/canvas/components/gridItemComponent';
import { WidgetOnGridLayout } from '@/app/canvas/types';

/**
 * Checks if the content of a page overflows the page height.
 * @param layoutsOnCurrentPage - The layouts of the current page.
 * @param widgetsOnCurrentPage - The widgets of the current page.
 * @returns An object containing two properties:
 *   - overflows: A boolean indicating if the content overflows the page height.
 *   - numOfRequiredPages: The number of pages required to display the content.
 */
export function isPageContentOverflow(
  layoutsOnCurrentPage: Layout[],
  widgetsOnCurrentPage: WidgetOnGridLayout[]
) {
  // If there are no layouts, we don't need any overflow pages
  if (layoutsOnCurrentPage.length === 0) {
    return { overflows: false, numOfRequiredPages: 1 };
  }

  // Calculate maximum bottom position across all items
  let maxBottom = 0;

  // Examine each widget to see if it extends beyond the page boundary
  for (let i = 0; i < layoutsOnCurrentPage.length; i++) {
    const layout = layoutsOnCurrentPage[i];
    const widget = widgetsOnCurrentPage[i];

    // Skip if we can't find the widget
    if (!widget || !widget.gridItemId) continue;

    // Look for the actual DOM element to get its rendered size
    const htmlElement = document
      .getElementById(widget.gridItemId)
      ?.getElementsByClassName(gridItemRootClassName)[0];

    if (!htmlElement) {
      // If element not found, use the layout dimensions as a fallback
      const bottom = (layout.y + layout.h) * GRID_ROW_HEIGHT;
      maxBottom = Math.max(maxBottom, bottom);
      continue;
    }

    // Get the actual rendered height of the element
    const elementHeight = htmlElement.getBoundingClientRect().height;
    // Calculate the position (y-coordinate) in pixels
    const positionHeight = layout.y * GRID_ROW_HEIGHT;
    // Get the grid-assigned height
    const gridHeight = layout.h * GRID_ROW_HEIGHT;

    // Calculate the actual bottom coordinate by taking the greater of:
    // 1. The grid-assigned bottom (position + grid height)
    // 2. The actual rendered bottom (position + element height)
    const bottom = positionHeight + Math.max(gridHeight, elementHeight);

    // Update max bottom if this widget extends further down
    maxBottom = Math.max(maxBottom, Math.floor(bottom) - 50);
  }

  // Calculate number of pages required based on maximum content height
  const numOfRequiredPages = Math.ceil(maxBottom / GRID_HEIGHT);

  // Consider content overflowing if it requires more than one page
  return {
    overflows: numOfRequiredPages > 1,
    numOfRequiredPages,
  };
}
