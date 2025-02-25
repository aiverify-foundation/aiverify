import { Layout } from 'react-grid-layout';

function findWidgetInsertPosition(layouts: Layout[], newItem: Layout): number {
  // Handle empty array case
  if (layouts.length === 0) return 0;

  // Binary search to find insert position
  let left = 0;
  let right = layouts.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const current = layouts[mid];

    // Compare Y positions first
    if (current.y < newItem.y) {
      left = mid + 1;
    } else if (current.y > newItem.y) {
      right = mid - 1;
    } else {
      // If Y positions are equal, compare X positions
      if (current.x < newItem.x) {
        left = mid + 1;
      } else if (current.x > newItem.x) {
        right = mid - 1;
      } else {
        // If both X and Y are equal, insert at this position
        return mid;
      }
    }
  }

  return left;
}

export { findWidgetInsertPosition };
