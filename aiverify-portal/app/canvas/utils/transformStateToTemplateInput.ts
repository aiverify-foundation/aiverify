import { Layout as ReactGridLayout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { Layout, Page, ReportTemplate } from '@/app/templates/types';

export function transformStateToTemplateInput(state: {
  layouts: ReactGridLayout[][];
  widgets: WidgetOnGridLayout[][];
  gridItemToAlgosMap: Record<string, WidgetAlgoAndResultIdentifier[]>;
  gridItemToInputBlockDatasMap: Record<string, WidgetInputBlockIdentifier[]>;
}): Partial<ReportTemplate> {
  // Construct pages array from layouts and widgets
  const pages = state.layouts.map((pageLayouts, pageIndex) => ({
    layouts: pageLayouts.map(
      (layout): Partial<Layout> => ({
        i: layout.i,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        maxW: layout.maxW ?? 12,
        maxH: layout.maxH ?? 36,
        minW: layout.minW ?? 1,
        minH: layout.minH ?? 1,
        static: false,
      })
    ),
    reportWidgets: state.widgets[pageIndex].map((widget) => ({
      widgetGID: widget.gid + ':' + widget.cid,
      key: widget.gridItemId,
      properties:
        widget.properties?.reduce<Record<string, string>>((acc, property) => {
          acc[property.key] = property.value ?? '';
          return acc;
        }, {}) ?? null,
    })),
  })) as Page[];

  return {
    pages,
  };
}
