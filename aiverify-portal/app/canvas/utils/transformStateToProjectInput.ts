import { Layout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm, InputBlock, WidgetProperty, MockData } from '@/app/types';

interface ProjectPatchInput {
  id?: number;
  pages: {
    layouts: Layout[];
    reportWidgets: {
      widgetGID: string;
      key: string;
      properties: WidgetProperty[] | null;
    }[];
  }[];
}

export function transformStateToProjectInput(state: {
  layouts: Layout[][];
  widgets: WidgetOnGridLayout[][];
  gridItemToAlgosMap: Record<string, WidgetAlgoAndResultIdentifier[]>;
  gridItemToInputBlockDatasMap: Record<string, WidgetInputBlockIdentifier[]>;
}): ProjectPatchInput {
  // Extract test results and input blocks from state
  // Construct pages array from layouts and widgets
  const pages = state.layouts.map((pageLayouts, pageIndex) => ({
    layouts: pageLayouts.map(
      (layout) =>
        ({
          ...layout,
          maxW: layout.maxW ?? 12,
          maxH: layout.maxH ?? 36,
          minW: layout.minW ?? 1,
          minH: layout.minH ?? 1,
          isDraggable: true,
          isResizable: true,
          resizeHandles: ['se'],
          isBounded: true,
          static: false,
        }) as Layout
    ),
    reportWidgets: state.widgets[pageIndex].map((widget) => ({
      widgetGID: widget.gid + ':' + widget.cid,
      key: widget.gridItemId,
      properties: widget.properties,
    })),
  }));
  return {
    pages,
  };
}
