import { Layout } from 'react-grid-layout';
import {
  GRID_HEIGHT,
  GRID_ROW_HEIGHT,
} from '@/app/canvas/components/dimensionsConstants';
import { gridItemRootClassName } from '@/app/canvas/components/gridItemComponent';
import { WidgetOnGridLayout } from '@/app/canvas/types';

/**
 * Checks if the content of the last item in the page overflows the page height.
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
  if (layoutsOnCurrentPage.length === 0) {
    return { overflows: false, numOfRequiredPages: 1 };
  }
  const lastItemIndex = layoutsOnCurrentPage.length - 1;
  const lastItemLayout = layoutsOnCurrentPage[lastItemIndex];
  const lastItemWidget = widgetsOnCurrentPage[lastItemIndex];
  const lastItemHtmlElement = document
    .getElementById(lastItemWidget.gridItemId)
    ?.getElementsByClassName(gridItemRootClassName)[0];
  if (!lastItemHtmlElement) {
    console.error(
      `Critical error: last item html element not found. Ensure gridItemComponent root element has the correct css class name: ${gridItemRootClassName}`
    );
    return { overflows: false, numOfRequiredPages: 1 };
  }
  const elementHeight = lastItemHtmlElement.getBoundingClientRect().height;
  const positionHeight = lastItemLayout.y * GRID_ROW_HEIGHT;
  const gridHeight = lastItemLayout.h * GRID_ROW_HEIGHT;
  const totalHeight = positionHeight + Math.max(gridHeight, elementHeight);
  const numOfRequiredPages = Math.ceil(totalHeight / GRID_HEIGHT);
  return { overflows: numOfRequiredPages > 1, numOfRequiredPages };
}
