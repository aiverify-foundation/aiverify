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
  }));

  return {
    pages,
  };
}
