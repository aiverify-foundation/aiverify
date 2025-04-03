import { Layout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import { WidgetOnGridLayout } from '@/app/canvas/types';

interface ProjectPatchInput {
  id?: number;
  pages: {
    layouts: {
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      maxW?: number;
      maxH?: number;
      minW?: number;
      minH?: number;
      isDraggable?: boolean;
      isResizable?: boolean;
      resizeHandles?: string[];
      isBounded?: boolean;
      static?: boolean;
    }[];
    reportWidgets: {
      widgetGID: string;
      key: string;
      properties: Record<string, string>;
    }[];
    isOverflowPage?: boolean;
    overflowParentIndex?: number | null;
  }[];
}

/**
 * Transforms the state object to a format suitable for saving to database
 * @param state The canvas state object
 * @param options Additional options for transformation
 * @param options.filterOverflowPages Whether to filter out overflow pages from output (defaults to true)
 * @returns Transformed data ready for project/template API
 */
export function transformStateToProjectInput(
  state: {
    layouts: Layout[][];
    widgets: WidgetOnGridLayout[][];
    gridItemToAlgosMap: Record<string, WidgetAlgoAndResultIdentifier[]>;
    gridItemToInputBlockDatasMap: Record<string, WidgetInputBlockIdentifier[]>;
    pageTypes: ('grid' | 'overflow')[];
    overflowParents: Array<number | null>;
  },
  options: { filterOverflowPages?: boolean } = { filterOverflowPages: true }
): ProjectPatchInput {
  // Create the pages array with all pages first
  const allPages = state.layouts.map((pageLayouts, pageIndex) => {
    // Check if this is an overflow page
    const isOverflowPage = state.pageTypes[pageIndex] === 'overflow';
    const overflowParent = state.overflowParents[pageIndex];

    // Create the page object
    return {
      layouts: pageLayouts.map((layout) => ({
        i: layout.i,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        maxW: layout.maxW ?? 12,
        maxH: layout.maxH ?? 36,
        minW: layout.minW ?? 1,
        minH: layout.minH ?? 1,
        isDraggable: true,
        isResizable: true,
        resizeHandles: ['se'],
        isBounded: true,
        static: false,
      })),
      reportWidgets: state.widgets[pageIndex].map((widget) => ({
        widgetGID: widget.gid + ':' + widget.cid,
        key: widget.gridItemId,
        properties:
          widget.properties?.reduce<Record<string, string>>((acc, property) => {
            acc[property.key] = property.value ?? '';
            return acc;
          }, {}) || {},
      })),
      isOverflowPage,
      overflowParentIndex: overflowParent,
    };
  });

  // Filter out overflow pages if requested
  const pages = options.filterOverflowPages
    ? allPages.filter(
        (_, pageIndex) => state.pageTypes[pageIndex] !== 'overflow'
      )
    : allPages;

  return {
    pages,
  };
}
